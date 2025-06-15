const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware de autenticação
// Importa modelos. Assumimos que os aliases 'paciente', 'medico', 'specialty'
// estão definidos nas suas associações Sequelize.
const { Appointment, User, Doctor, Specialty } = require('../models');

// Aplicar middleware de autenticação a todas as rotas de agendamentos
router.use(auth);

// Helper para formatar a resposta da consulta para o formato da API (id, data, descricao, specialty)
// Ajuste os acessos a .medico e .specialty conforme os aliases definidos nos seus modelos.
const formatAppointmentResponse = (appointment) => {
    if (!appointment) return null;

    
    const doctor = appointment.medico; // Assume que Appointment.belongsTo(Doctor, { as: 'medico', ... })
    const specialty = doctor && doctor.specialty; // Assume que Doctor.belongsTo(Specialty, { as: 'specialty', ... })

    const timePart = appointment.time ? appointment.time : '00:00:00'; // Usa a string time diretamente se disponível
    
    const apiData = appointment.date ? `${appointment.date}T${timePart}${timePart.includes('Z') ? '' : 'Z'}` : null;

    return {
        id: appointment.id,
        data: apiData,
        descricao: appointment.notes, // Mapeia notes para descricao
        medico: doctor ? { // <-- ADICIONAR ISTO: Inclui os dados do médico
            id: doctor.id,
            name: doctor.name
        } : null,
        specialty: specialty ? {
            id: specialty.id,
            name: specialty.name
        } : null
    };
    //
    //return {
    //    id: appointment.id,
    //    data: apiData, // Data e hora combinadas no formato ISO 8601
    //    descricao: appointment.notes, // Mapeia notes para descricao
    //    // Inclui a especialidade aninhada conforme o esquema OpenAPI do GET list
    //    specialty: specialty ? {
    //        id: specialty.id,
    //        name: specialty.name
    //    } : null
        // Não inclui pacienteId ou medicoId no nível superior para GETs conforme pedido no texto e YAML do GET list.
        // Se o GET por ID precisar deles (conforme o seu YAML da última vez), ajuste o handler do GET por ID ou formate aqui.
    //};
};

// Helper para garantir que o utilizador autenticado é o dono da consulta ou é admin
const authorizeAppointmentAccess = (req, appointment) => {
    // Se não encontrou a consulta, não há acesso
    if (!appointment) return false;

    // Se o utilizador autenticado não existe ou não tem o campo 'role', nega o acesso (deveria ser tratado pelo middleware 'auth')
    if (!req.user || !req.user.role) return false;

    // Se o utilizador é admin, permite o acesso
    if (req.user.role === 'admin') {
        return true;
    }

    // Se a consulta pertence ao utilizador autenticado, permite o acesso
    // A coluna é user_id na BD. Assumimos que o modelo Sequelize mapeia user_id da BD
    // para a propriedade user_id na instância do modelo. Verifique se é 'user_id' ou 'userId'.
    const appointmentUserId = appointment.user_id; // Assumindo user_id na instância do modelo (verificar o seu modelo)

    if (req.user.id === appointmentUserId) {
        return true;
    }

    // Caso contrário, nega o acesso
    return false;
};


// GET /appointments - Retorna uma lista de consultas do utilizador autenticado (ou todas para admin), incluindo especialidade
// Corresponde ao esquema GET /appointments no OpenAPI (id, data, descricao, specialty)
router.get('/', async (req, res) => {
    try {
        // Filtra pelo ID do utilizador autenticado, a menos que seja admin
        const where = req.user.role === 'admin' ? {} : { user_id: req.user.id }; // Usa user_id conforme DB schema/modelo

        const appointments = await Appointment.findAll({
            where,
            // Seleciona os campos base necessários da tabela de agendamentos
            attributes: ['id', 'date', 'time', 'notes', 'user_id', 'doctor_id'], // Incluir FKs se necessário para lógica ou resposta detalhada
            include: [
                // Inclui Doutor e, através dele, a Especialidade para formatar a resposta
                // Adapte os aliases 'medico' e 'specialty' conforme as suas definições de associação
                {
                    model: Doctor,
                    as: 'medico', // Alias assumido para Appointment.belongsTo(Doctor)
                    attributes: ['id', 'name', 'specialty_id'], // Precisa de specialty_id do Doctor para incluir Specialty
                    include: [{
                        model: Specialty,
                        as: 'specialty', // Alias assumido para Doctor.belongsTo(Specialty)
                        attributes: ['id', 'name'] // Atributos da Especialidade
                    }]
                },
                // Opcional: Incluir o Utilizador (Paciente) - útil para admins ou para resposta detalhada.
                // Se não for necessário na resposta ou lógica, pode remover este include para performance.
                {
                    model: User,
                    as: 'paciente', // Alias assumido para Appointment.belongsTo(User)
                    attributes: ['id', 'name'] // Atributos do Utilizador (Paciente)
                }
            ],
            order: [['date', 'ASC'], ['time', 'ASC']] // Opcional: Ordenar resultados
        });

        // Formatar a lista de respostas para o formato da API desejado (id, data, descricao, specialty)
        const formattedAppointments = appointments.map(formatAppointmentResponse);

        res.json(formattedAppointments);

    } catch (error) {
        console.error('Erro ao listar consultas:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao listar consultas.' });
    }
});

// POST /appointments - Cria uma nova consulta
// Corresponde ao esquema POST /appointments no OpenAPI
router.post('/', auth, async (req, res) => { // Aplica 'auth' diretamente à rota

    const pacienteId = req.user.id; // ID do utilizador autenticado obtido do req.user
    const { data, medicoId, especialidadeId, descricao /*, pacienteId - ignorado se vier no body */ } = req.body;

    if (!data || !medicoId || !especialidadeId) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando: data, medicoId, especialidadeId.' });
    }

    try {
        const doctor = await Doctor.findByPk(medicoId, {
            include: [{
                model: Specialty,
                as: 'specialty', // Alias assumido para Doctor.belongsTo(Specialty)
                attributes: ['id'] // Apenas precisamos do ID para validar
            }],

            rejectOnEmpty: true
        });

        if (!doctor.specialty || doctor.specialty.id !== especialidadeId) {
            return res.status(400).json({ error: 'Médico não encontrado ou não associado à especialidade fornecida.' });
        }

        const appointmentDateTime = new Date(data);


        if (isNaN(appointmentDateTime.getTime())) {
            return res.status(400).json({ error: 'Formato de data e hora inválido.' });
        }

        const dbDate = appointmentDateTime.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        const dbTime = appointmentDateTime.toTimeString().split(' ')[0]; // Ex: "10:30:00"



        const appointment = await Appointment.create({
            date: dbDate, // Mapeia 'data' (parte da data) para 'date' na BD
            time: dbTime, // Mapeia 'data' (parte da hora formatada) para 'time' na BD
            notes: descricao, // Mapeia 'descricao' para 'notes' na BD
            user_id: pacienteId, // Mapeia 'pacienteId' (do auth) para 'user_id' na BD
            doctor_id: medicoId // Mapeia 'medicoId' para 'doctor_id' na BD

        });

        const createdAppointmentDetails = await Appointment.findByPk(appointment.id, {

            attributes: ['id', 'date', 'time', 'notes', 'user_id', 'doctor_id'],
            include: [

                {
                    model: Doctor,
                    as: 'medico', // Alias assumido
                    attributes: ['id', 'name'],
                    include: [{
                        model: Specialty,
                        as: 'specialty', // Alias assumido
                        attributes: ['id', 'name']
                    }]
                },

                {
                    model: User,
                    as: 'paciente', // Alias assumido
                    attributes: ['id', 'name'] // Campos do Paciente
                }
            ]
        });

        res.status(201).json(createdAppointmentDetails);


    } catch (error) {
        console.error('Erro ao criar consulta:', error);

        if (error.name === 'SequelizeForeignKeyConstraintError') {

            return res.status(400).json({ error: 'ID de médico ou paciente inválido.' });
        }
        // Adicionado tratamento para o caso de o médico não ser encontrado na validação inicial
        if (error.name === 'SequelizeEmptyResultError') {
            return res.status(400).json({ error: 'Médico não encontrado com o ID fornecido.' });
        }

        res.status(500).json({ error: 'Erro interno do servidor ao criar consulta.' });
    }
});

// GET /appointments/:id - Retorna uma consulta específica pelo ID
// O esquema OpenAPI GET /appointments/{id} que forneceu na última vez inclui pacienteId, medicoId, mas não specialty aninhado.
// No entanto, o pedido original de texto era id, data, specialty para os GETs.
// Vamos seguir o pedido original de texto para consistência nos GETs (id, data, descricao, specialty).
// Se precisar de paciente/medico incluídos no GET por ID, ajuste a formatação da resposta.
router.get('/:id', async (req, res) => {
    const appointmentId = req.params.id; // Pega o ID dos parâmetros do URL

    try {
        // Busca a consulta pelo ID e inclui Doutor e Especialidade
        const appointment = await Appointment.findByPk(appointmentId, {
            // Seleciona os campos base necessários
            attributes: ['id', 'date', 'time', 'notes', 'user_id', 'doctor_id'], // Incluir FKs para autorização
            include: [
                {
                    model: Doctor,
                    as: 'medico', // Alias assumido
                    attributes: ['id', 'name'], // Atributos do Doutor
                    include: [{
                        model: Specialty,
                        as: 'specialty', // Alias assumido
                        attributes: ['id', 'name'] // Atributos da Especialidade
                    }]
                },
                // Incluir Utilizador para verificação de autorização e potencialmente para a resposta
                {
                    model: User,
                    as: 'paciente', // Alias assumido
                    attributes: ['id', 'name'] // Atributos do Utilizador
                }
            ]
        });

        // Se a consulta não for encontrada
        if (!appointment) {
            return res.status(404).json({ error: 'Consulta não encontrada.' });
        }

        // Verificação de autorização: o utilizador autenticado é o dono OU é admin
        if (!authorizeAppointmentAccess(req, appointment)) {
            return res.status(403).json({ error: 'Acesso negado. Não tem permissão para visualizar esta consulta.' });
        }

        // Formata a resposta para o formato da API desejado (id, data, descricao, specialty)
        // Se o esquema OpenAPI para GET por ID for diferente do GET list, ajuste aqui.
        const formattedAppointment = formatAppointmentResponse(appointment);

        // Se o esquema GET por ID incluir mais detalhes (paciente, medico), formate aqui. Ex:
        /*
        const detailedAppointment = {
           id: appointment.id,
           data: `${appointment.date}T${appointment.time ? appointment.time.toISOString().split('T')[1] : '00:00:00.000Z'}`,
           descricao: appointment.notes,
           paciente: appointment.paciente ? { id: appointment.paciente.id, name: appointment.paciente.name } : null,
           medico: appointment.medico ? {
               id: appointment.medico.id,
               name: appointment.medico.name,
               specialty: appointment.medico.specialty ? { id: appointment.medico.specialty.id, name: appointment.medico.specialty.name } : null
           } : null
        };
        res.json(detailedAppointment);
        */

        res.json(formattedAppointment); // Retorna o formato simplificado por padrão

    } catch (error) {
        console.error(`Erro ao buscar consulta com ID ${appointmentId}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar consulta.' });
    }
});

// PUT /appointments/:id - Atualiza os dados de uma consulta
// Corresponde ao esquema PUT /appointments/{id} no OpenAPI
router.put('/:id', async (req, res) => {
    const appointmentId = req.params.id; // Pega o ID dos parâmetros do URL
    const { data, descricao, medicoId, especialidadeId /*, pacienteId - ignorado do body */ } = req.body;

    try {
        const appointment = await Appointment.findByPk(appointmentId);

        if (!appointment) {
            return res.status(404).json({ error: 'Consulta não encontrada' });
        }

        // Verificação de autorização: o utilizador autenticado é o dono OU é admin
        if (!authorizeAppointmentAccess(req, appointment)) {
            return res.status(403).json({ error: 'Acesso negado. Não tem permissão para editar esta consulta.' });
        }

        // Prepara objeto com os campos a serem atualizados, mapeando API para BD
        const updateFields = {};

        // Se data for fornecida, processa e adiciona date e time aos updateFields
        if (data !== undefined) {
            const appointmentDateTime = new Date(data);
            if (isNaN(appointmentDateTime.getTime())) {
                return res.status(400).json({ error: 'Formato de data e hora inválido.' });
            }
            updateFields.date = appointmentDateTime.toISOString().split('T')[0]; // Mapeia 'data' (parte da data) para 'date' na BD
            // Extrai a parte da hora e formata. Ajuste conforme o formato TIME da sua BD.
            updateFields.time = appointmentDateTime.toTimeString().split(' ')[0]; // Ex: "10:30:00" (pode precisar de mais formatação)
        }

        // Se descricao for fornecida, adiciona notes aos updateFields
        if (descricao !== undefined) {
            updateFields.notes = descricao; // Mapeia 'descricao' para 'notes' na BD
        }

        // Se medicoId for fornecido, valida e adiciona doctor_id aos updateFields
        if (medicoId !== undefined) {
            // Opcional/Recomendado: Verificar se o novo medicoId existe
            const doctor = await Doctor.findByPk(medicoId, {
                include: [{
                    model: Specialty,
                    as: 'specialty', // Alias assumido
                    attributes: ['id']
                }]
            });

            if (!doctor) {
                return res.status(400).json({ error: 'ID do médico inválido.' });
            }

            // Se especialidadeId também for fornecida na atualização, valida o medicoId contra ela
            if (especialidadeId !== undefined) {
                if (!doctor.specialty || doctor.specialty.id !== especialidadeId) {
                    return res.status(400).json({ error: 'Novo médico não associado à especialidade fornecida.' });
                }
            }

            updateFields.doctor_id = medicoId; // Mapeia 'medicoId' para 'doctor_id' na BD
        }

        // pacienteId do body é ignorado. user_id na BD não deve ser alterado por PUT (a menos que seja admin com endpoint diferente).

        // Se não houver campos válidos para atualizar no body, retorna 400
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error: 'Nenhum campo de atualização válido fornecido (data, descricao, medicoId).' });
        }

        // Atualiza os dados da consulta na base de dados
        await appointment.update(updateFields);

        // Opcional: Buscar a consulta atualizada com os dados incluídos para a resposta 200
        // O esquema OpenAPI 200 para PUT é o objeto atualizado. Vamos retorná-lo formatado.
        const updatedAppointmentDetails = await Appointment.findByPk(appointment.id, {
            // Incluir campos base
            attributes: ['id', 'date', 'time', 'notes', 'user_id', 'doctor_id'],
            include: [
                // Inclui o Médico e Especialidade (e Paciente se necessário)
                {
                    model: Doctor,
                    as: 'medico', // Alias assumido
                    attributes: ['id', 'name'],
                    include: [{
                        model: Specialty,
                        as: 'specialty', // Alias assumido
                        attributes: ['id', 'name']
                    }]
                },
                {
                    model: User,
                    as: 'paciente', // Alias assumido
                    attributes: ['id', 'name']
                }
            ]
        });

        // Formata a resposta
        // Se o esquema 200 do PUT no OpenAPI for mais detalhado que o GET, ajuste a formatação aqui.
        // Vamos retornar o objeto formatado similar ao GET list/ID por padrão.
        const formattedResponse = formatAppointmentResponse(updatedAppointmentDetails);

        // Se o esquema 200 do PUT for mais detalhado (incluir paciente, medico, etc.), formate aqui.

        res.json(formattedResponse); // Retorna o objeto atualizado formatado

    } catch (error) {
        console.error(`Erro ao editar consulta com ID ${appointmentId}:`, error);
        // Tratamento de erro mais específico, ex: SequelizeForeignKeyConstraintError
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: 'ID de médico inválido na atualização.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao editar consulta.' });
    }
});

// Eliminar consulta
// Corresponde ao esquema DELETE /appointments/{id} no OpenAPI (ajustando para 204)
router.delete('/:id', async (req, res) => {
    const appointmentId = req.params.id; // Pega o ID dos parâmetros do URL

    try {
        const appointment = await Appointment.findByPk(appointmentId);

        if (!appointment) {
            return res.status(404).json({ error: 'Consulta não encontrada' });
        }

        // Verificação de autorização: o utilizador autenticado é o dono OU é admin
        if (!authorizeAppointmentAccess(req, appointment)) {
            return res.status(403).json({ error: 'Acesso negado. Não tem permissão para eliminar esta consulta.' });
        }

        // Elimina a consulta
        await appointment.destroy();

        // Resposta de sucesso (usando 204 No Content) - Conforme prática RESTful, ajustado do 200 do seu OpenAPI
        res.status(204).send();

    } catch (error) {
        console.error(`Erro ao eliminar consulta com ID ${appointmentId}:`, error);
        // Considere tratamento de erro se a consulta tiver dados dependentes (embora improvável para Appointment)
        res.status(500).json({ error: 'Erro interno do servidor ao eliminar consulta.' });
    }
});


module.exports = router;