const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Appointment, User, Doctor, Specialty } = require('../models');

router.use(auth);

const formatAppointmentResponse = (appointment) => {
    if (!appointment) return null;

    const doctor = appointment.medico;
    const specialty = doctor && doctor.specialty;

    // ----- PONTO CRÍTICO PARA A HORA -----
    // Se o `appointment.time` já vem da BD como uma string 'HH:MM:SS',
    // não precisa de mais formatação aqui. Se for um objeto Date, então `toLocaleTimeString`
    // é adequado, mas garanta que não está a aplicar `toLocaleTimeString` a algo que já é string.
    // Vamos assumir que `appointment.time` é uma string 'HH:MM:SS' vinda da BD.
    const timePart = appointment.time; // Ex: "10:30:00"

    // Combinar date (YYYY-MM-DD) e time (HH:MM:SS) para uma string ISO 8601 completa.
    // A adição de 'Z' (Zulu time/UTC) é importante se os seus horários na BD são UTC.
    // Se são horários locais sem ajuste de fuso horário, o 'Z' pode causar problemas de interpretação.
    // Para simplificar, assumimos que queremos UTC ou que o frontend irá ajustar.
    const apiData = appointment.date && timePart ? `${appointment.date}T${timePart}.000Z` : null; // Adicionei .000Z para conformidade mais estrita

    return {
        id: appointment.id,
        data: apiData, // Data e hora combinadas no formato ISO 8601
        descricao: appointment.notes,
        specialty: specialty ? {
            id: specialty.id,
            name: specialty.name
        } : null,
        medico: doctor ? {
            id: doctor.id,
            name: doctor.name
        } : null,
        paciente: appointment.paciente ? {
            id: appointment.paciente.id,
            name: appointment.paciente.name
        } : null
    };
};

const authorizeAppointmentAccess = (req, appointment) => {
    if (!appointment) return false;
    if (!req.user || !req.user.role) return false;
    if (req.user.role === 'admin') {
        return true;
    }
    const appointmentUserId = appointment.user_id;
    if (req.user.id === appointmentUserId) {
        return true;
    }
    return false;
};

// GET /appointments - Listar consultas
router.get('/', async (req, res) => {
    const { patientId, doctorId } = req.query;
    const whereClause = {};

    // DEBUG: Log para ver os filtros recebidos
    console.log(`GET /appointments - patientId: ${patientId}, doctorId: ${doctorId}`);

    if (req.user.role !== 'admin') {
        whereClause.user_id = req.user.id;
    }

    if (patientId) {
        if (whereClause.user_id && whereClause.user_id !== parseInt(patientId)) {
            return res.status(403).json({ error: 'Acesso negado. Não tem permissão para visualizar consultas de outro paciente.' });
        }
        whereClause.user_id = parseInt(patientId);
    }

    if (doctorId) {
        whereClause.doctor_id = parseInt(doctorId);
    }

    try {
        const appointments = await Appointment.findAll({
            where: whereClause,
            attributes: ['id', 'date', 'time', 'notes', 'user_id', 'doctor_id'],
            include: [
                {
                    model: Doctor,
                    as: 'medico',
                    attributes: ['id', 'name', 'specialty_id'],
                    include: [{
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name']
                    }]
                },
                {
                    model: User,
                    as: 'paciente',
                    attributes: ['id', 'name']
                }
            ],
            order: [['date', 'ASC'], ['time', 'ASC']]
        });

        // DEBUG: Log para ver o número de consultas encontradas e o primeiro formato
        console.log(`Found ${appointments.length} appointments.`);
        if (appointments.length > 0) {
            console.log('First appointment raw data:', appointments[0].toJSON());
            console.log('First appointment formatted data:', formatAppointmentResponse(appointments[0]));
        }

        const formattedAppointments = appointments.map(formatAppointmentResponse);
        res.json(formattedAppointments);

    } catch (error) {
        console.error('Erro ao listar consultas:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao listar consultas.' });
    }
});

// POST /appointments - Cria uma nova consulta
router.post('/', auth, async (req, res) => {
    const pacienteId = req.user.id;
    const { data, medicoId, especialidadeId, descricao } = req.body;

    if (!data || !medicoId || !especialidadeId) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando: data, medicoId, especialidadeId.' });
    }

    try {
        const doctor = await Doctor.findByPk(medicoId, {
            include: [{
                model: Specialty,
                as: 'specialty',
                attributes: ['id']
            }],
            rejectOnEmpty: true
        });

        if (!doctor.specialty || doctor.specialty.id !== especialidadeId) {
            return res.status(400).json({ error: 'Médico não encontrado ou não associado à especialidade fornecida.' });
        }

        const appointmentDateTime = new Date(data);
        if (isNaN(appointmentDateTime.getTime())) {
            console.error('Data e hora de entrada inválida:', data); // DEBUG
            return res.status(400).json({ error: 'Formato de data e hora inválido.' });
        }

        const dbDate = appointmentDateTime.toISOString().split('T')[0]; // YYYY-MM-DD

        // ----- PONTO CRÍTICO PARA A HORA NA INSERÇÃO -----
        // Garanta que 'time' é guardado no formato HH:MM:SS ou HH:MM:SS.sss.
        // O `toLocaleTimeString` é uma boa escolha, mas verifique o locale e as opções.
        const dbTime = appointmentDateTime.toLocaleTimeString('en-GB', { // Usar en-GB para garantir HH:MM:SS
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // Formato 24 horas
        });
        // DEBUG: Log para ver a data e hora que serão salvas
        console.log(`Saving to DB: Date=${dbDate}, Time=${dbTime}`);

        const appointment = await Appointment.create({
            date: dbDate,
            time: dbTime,
            notes: descricao,
            user_id: pacienteId,
            doctor_id: medicoId
        });

        const createdAppointmentDetails = await Appointment.findByPk(appointment.id, {
            attributes: ['id', 'date', 'time', 'notes', 'user_id', 'doctor_id'],
            include: [
                { model: Doctor, as: 'medico', attributes: ['id', 'name'], include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }] },
                { model: User, as: 'paciente', attributes: ['id', 'name'] }
            ]
        });

        res.status(201).json(formatAppointmentResponse(createdAppointmentDetails));

    } catch (error) {
        console.error('Erro ao criar consulta:', error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: 'ID de médico ou paciente inválido.' });
        }
        if (error.name === 'SequelizeEmptyResultError') {
            return res.status(400).json({ error: 'Médico não encontrado com o ID fornecido.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao criar consulta.' });
    }
});

// PUT /appointments/:id - Atualiza os dados de uma consulta
router.put('/:id', async (req, res) => {
    const appointmentId = req.params.id;
    const { data, descricao, medicoId, especialidadeId } = req.body;

    try {
        const appointment = await Appointment.findByPk(appointmentId);

        if (!appointment) {
            return res.status(404).json({ error: 'Consulta não encontrada' });
        }

        if (!authorizeAppointmentAccess(req, appointment)) {
            return res.status(403).json({ error: 'Acesso negado. Não tem permissão para editar esta consulta.' });
        }

        const updateFields = {};

        if (data !== undefined) {
            const appointmentDateTime = new Date(data);
            if (isNaN(appointmentDateTime.getTime())) {
                console.error('Data e hora de atualização inválida:', data); // DEBUG
                return res.status(400).json({ error: 'Formato de data e hora inválido.' });
            }
            updateFields.date = appointmentDateTime.toISOString().split('T')[0];
            // ----- PONTO CRÍTICO PARA A HORA NA ATUALIZAÇÃO -----
            updateFields.time = appointmentDateTime.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            // DEBUG: Log para ver a data e hora que serão atualizadas
            console.log(`Updating to DB: Date=${updateFields.date}, Time=${updateFields.time}`);
        }

        if (descricao !== undefined) {
            updateFields.notes = descricao;
        }

        if (medicoId !== undefined) {
            const doctor = await Doctor.findByPk(medicoId, {
                include: [{ model: Specialty, as: 'specialty', attributes: ['id'] }]
            });

            if (!doctor) {
                return res.status(400).json({ error: 'ID do médico inválido.' });
            }

            if (especialidadeId !== undefined) {
                if (!doctor.specialty || doctor.specialty.id !== especialidadeId) {
                    return res.status(400).json({ error: 'Novo médico não associado à especialidade fornecida.' });
                }
            }
            updateFields.doctor_id = medicoId;
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error: 'Nenhum campo de atualização válido fornecido (data, descricao, medicoId).' });
        }

        await appointment.update(updateFields);

        const updatedAppointmentDetails = await Appointment.findByPk(appointment.id, {
            attributes: ['id', 'date', 'time', 'notes', 'user_id', 'doctor_id'],
            include: [
                { model: Doctor, as: 'medico', attributes: ['id', 'name'], include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }] },
                { model: User, as: 'paciente', attributes: ['id', 'name'] }
            ]
        });

        res.json(formatAppointmentResponse(updatedAppointmentDetails));

    } catch (error) {
        console.error(`Erro ao editar consulta com ID ${appointmentId}:`, error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: 'ID de médico inválido na atualização.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao editar consulta.' });
    }
});


// Eliminar consulta
router.delete('/:id', async (req, res) => {
    const appointmentId = req.params.id;

    try {
        const appointment = await Appointment.findByPk(appointmentId);

        if (!appointment) {
            return res.status(404).json({ error: 'Consulta não encontrada' });
        }

        if (!authorizeAppointmentAccess(req, appointment)) {
            return res.status(403).json({ error: 'Acesso negado. Não tem permissão para eliminar esta consulta.' });
        }

        await appointment.destroy();

        res.status(204).send();

    } catch (error) {
        console.error(`Erro ao eliminar consulta com ID ${appointmentId}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor ao eliminar consulta.' });
    }
});

module.exports = router;