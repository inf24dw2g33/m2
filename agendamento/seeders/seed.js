// seeders/seed.js
const db = require('../models'); // Importa todos os modelos do index.js
const { User, Specialty, Doctor, Appointment, sequelize } = db;

function formatDateForDB(dateObj) {
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function seedDatabase() {
    try {
        console.log('Limpando e sincronizando o banco de dados para os novos modelos...');
        await sequelize.sync({ force: false });
        console.log('Iniciando o seeding da base de dados com dados de clínica...');

        // 1. Inserir Users
        const usersData = [
            { name: 'António Filipe', email: 'umaia.dw2425@gmail.com', google_id: 'google_id_1', role: 'admin' },
            { name: 'Carlos Silva', email: 'carlos.silva@email.com', google_id: 'google_id_2', role: 'user' },
            { name: 'Maria Oliveira', email: 'maria.oliveira@email.com', google_id: 'google_id_3', role: 'user' },
            { name: 'João Pereira', email: 'joao.pereira@email.com', google_id: 'google_id_4', role: 'user' },
            { name: 'Patrícia Martins', email: 'patricia.martins@email.com', google_id: 'google_id_5', role: 'user' },
            { name: 'José Souza', email: 'jose.souza@email.com', google_id: 'google_id_6', role: 'user' },
            { name: 'Fernanda Rocha', email: 'fernanda.rocha@email.com', google_id: 'google_id_7', role: 'user' },
            { name: 'Ricardo Almeida', email: 'ricardo.almeida@email.com', google_id: 'google_id_8', role: 'user' },
            { name: 'Raquel Lima', email: 'raquel.lima@email.com', google_id: 'google_id_9', role: 'user' },
            { name: 'Roberto Barbosa', email: 'roberto.barbosa@email.com', google_id: 'google_id_10', role: 'user' },
            { name: 'Gustavo Oliveira', email: 'gustavo.oliveira@email.com', google_id: 'google_id_11', role: 'user' },
            { name: 'Cláudia Silva', email: 'claudia.silva@email.com', google_id: 'google_id_12', role: 'user' },
            { name: 'Beatriz Santos', email: 'beatriz.santos@email.com', google_id: 'google_id_13', role: 'user' },
            { name: 'Eduardo Ferreira', email: 'eduardo.ferreira@email.com', google_id: 'google_id_14', role: 'user' },
            { name: 'Luciana Costa', email: 'luciana.costa@email.com', google_id: 'google_id_15', role: 'user' },
            { name: 'Marta Souza', email: 'marta.souza@email.com', google_id: 'google_id_16', role: 'user' },
            { name: 'Juliano Martins', email: 'juliano.martins@email.com', google_id: 'google_id_17', role: 'user' },
            { name: 'Aline Rocha', email: 'aline.rocha@email.com', google_id: 'google_id_18', role: 'user' },
            { name: 'Leonardo Costa', email: 'leonardo.costa@email.com', google_id: 'google_id_19', role: 'user' },
            { name: 'Vera Lima', email: 'vera.lima@email.com', google_id: 'google_id_20', role: 'user' },
            { name: 'Luciano Pereira', email: 'luciano.pereira@email.com', google_id: 'google_id_21', role: 'user' },
            { name: 'Carla Santos', email: 'carla.santos@email.com', google_id: 'google_id_22', role: 'user' },
            { name: 'Felipe Oliveira', email: 'felipe.oliveira@email.com', google_id: 'google_id_23', role: 'user' },
            { name: 'Cíntia Rocha', email: 'cintia.rocha@email.com', google_id: 'google_id_24', role: 'user' },
            { name: 'Rogério Lima', email: 'rogerio.lima@email.com', google_id: 'google_id_25', role: 'user' },
            { name: 'Sofia Costa', email: 'sofia.costa@email.com', google_id: 'google_id_26', role: 'user' },
            { name: 'Vinícius Ferreira', email: 'vinicius.ferreira@email.com', google_id: 'google_id_27', role: 'user' },
            { name: 'Roberta Martins', email: 'roberta.martins@email.com', google_id: 'google_id_28', role: 'user' },
            { name: 'Adriana Souza', email: 'adriana.souza@email.com', google_id: 'google_id_29', role: 'user' },
            { name: 'Simone Almeida', email: 'simone.almeida@email.com', google_id: 'google_id_30', role: 'user' },
            { name: 'Felipe Lima', email: 'felipe.lima@email.com', google_id: 'google_id_31', role: 'user' },
            { name: 'Regina Costa', email: 'regina.costa@email.com', google_id: 'google_id_32', role: 'user' },
            { name: 'Breno Silva', email: 'breno.silva@email.com', google_id: 'google_id_33', role: 'user' },
            { name: 'Marcelo Rocha', email: 'marcelo.rocha@email.com', google_id: 'google_id_34', role: 'user' },
            { name: 'Patrícia Oliveira', email: 'patricia.oliveira@email.com', google_id: 'google_id_35', role: 'user' },
            { name: 'Juliana Ferreira', email: 'juliana.ferreira@email.com', google_id: 'google_id_36', role: 'user' },
            { name: 'Ricardo Santos', email: 'ricardo.santos@email.com', google_id: 'google_id_37', role: 'user' },
            { name: 'Mariana Lima', email: 'mariana.lima@email.com', google_id: 'google_id_38', role: 'user' },
            { name: 'Tiago Almeida', email: 'tiago.almeida@email.com', google_id: 'google_id_39', role: 'user' },
            { name: 'Marcos Ferreira', email: 'marcos.ferreira@email.com', google_id: 'google_id_40', role: 'user' },
            { name: 'Ana Costa', email: 'ana.costa@email.com', google_id: 'google_id_41', role: 'user' }
            
        ];
        const users = await User.bulkCreate(usersData, { returning: true });
        console.log('Utilizadores inseridos.');

        // 2. Inserir Specialties
        const specialtiesData = [
            { name: 'Cardiologia' },
            { name: 'Ortopedia' },
            { name: 'Pediatria' },
            { name: 'Ginecologia' },
            { name: 'Dermatologia' },
            { name: 'Oftalmologia' },
            { name: 'Psiquiatria' },
            { name: 'Neurologia' },
            { name: 'Radiologia' },
            { name: 'Urologia' },
            { name: 'Endocrinologia' },
            { name: 'Geriatria' },
            { name: 'Oncologia' },
            { name: 'Reumatologia' },
            { name: 'Gastroenterologia' },
            { name: 'Infectologia' },
            { name: 'Otorrinolaringologia' },
            { name: 'Cirurgia Geral' },
            { name: 'Anestesiologia' }
        ];
        const specialties = await Specialty.bulkCreate(specialtiesData, { returning: true });
    console.log('Especialidades inseridas.');

        // 3. Inserir Doctors
        const doctorsData = [
            { name: 'Dr. João Almeida', specialty_id: specialties[0].id },
            { name: 'Dr. Marcos Silva', specialty_id: specialties[1].id },
            { name: 'Dr. Clara Martins', specialty_id: specialties[2].id },
            { name: 'Dr. Felipe Rocha', specialty_id: specialties[3].id },
            { name: 'Dr. Ricardo Costa', specialty_id: specialties[4].id },
            { name: 'Dr. Paula Souza', specialty_id: specialties[5].id },
            { name: 'Dr. Bruno Lima', specialty_id: specialties[6].id },
            { name: 'Dr. André Santos', specialty_id: specialties[7].id },
            { name: 'Dr. Luana Ferreira', specialty_id: specialties[8].id },
            { name: 'Dr. Mariana Oliveira', specialty_id: specialties[9].id },
            { name: 'Dr. Eduardo Barbosa', specialty_id: specialties[10].id },
            { name: 'Dr. Gabriel Rocha', specialty_id: specialties[11].id }, 
            { name: 'Dr. Helena Costa', specialty_id: specialties[12].id },
            { name: 'Dr. Gustavo Pereira', specialty_id: specialties[13].id },
            { name: 'Dr. Julia Almeida', specialty_id: specialties[14].id },
            { name: 'Dr. Camila Lima', specialty_id: specialties[15].id },
            { name: 'Dr. Sergio Souza', specialty_id: specialties[16].id },
            { name: 'Dr. Larissa Santos', specialty_id: specialties[17].id },
            { name: 'Dr. Mariana Costa', specialty_id: specialties[18].id },
            { name: 'Dr. Arthur Costa', specialty_id: specialties[0].id },
            { name: 'Dr. Vanessa Lima', specialty_id: specialties[1].id },
            { name: 'Dr. Thiago Souza', specialty_id: specialties[2].id },
            { name: 'Dr. Carolina Rocha', specialty_id: specialties[3].id },
            { name: 'Dr. Felipe Pereira', specialty_id: specialties[4].id },
            { name: 'Dr. Mariana Santos', specialty_id: specialties[5].id },
            { name: 'Dr. André Lima', specialty_id: specialties[6].id },
            { name: 'Dr. Lucas Almeida', specialty_id: specialties[7].id },
            { name: 'Dr. Paula Barbosa', specialty_id: specialties[8].id },
            { name: 'Dr. Ricardo Ferreira', specialty_id: specialties[9].id },
            { name: 'Dr. Letícia Costa', specialty_id: specialties[10].id },
            { name: 'Dr. Roberto Oliveira', specialty_id: specialties[11].id },
            { name: 'Dr. Carlos Pereira', specialty_id: specialties[12].id },
            { name: 'Dr. Ana Souza', specialty_id: specialties[13].id },
            { name: 'Dr. João Lima', specialty_id: specialties[14].id },
            { name: 'Dr. Beatriz Costa', specialty_id: specialties[15].id },
            { name: 'Dr. Jorge Rocha', specialty_id: specialties[16].id },
            { name: 'Dr. Clarice Santos', specialty_id: specialties[17].id },
            { name: 'Dr. Ricardo Barbosa', specialty_id: specialties[18].id }
            
        ];
        const doctors = await Doctor.bulkCreate(doctorsData, { returning: true });
        console.log('Médicos inseridos.');

        // 4. Inserir Appointments
        const appointmentsData = [
            { date: '2025-03-28', time: '10:00:00', notes: 'Consulta de rotina ortopédica', user_id: users[0].id, doctor_id: doctors[1].id },
            { date: '2025-03-28', time: '11:00:00', notes: 'Exame de pressão arterial', user_id: users[1].id, doctor_id: doctors[0].id },
            { date: '2025-03-29', time: '09:00:00', notes: 'Consulta pediátrica geral', user_id: users[2].id, doctor_id: doctors[2].id },
            { date: '2025-03-29', time: '10:00:00', notes: 'Acompanhamento ginecológico', user_id: users[3].id, doctor_id: doctors[3].id },
            { date: '2025-03-30', time: '14:00:00', notes: 'Consulta dermatológica', user_id: users[4].id, doctor_id: doctors[4].id },
            { date: '2025-03-30', time: '15:00:00', notes: 'Avaliação oftalmológica', user_id: users[5].id, doctor_id: doctors[5].id },
            { date: '2025-03-31', time: '10:00:00', notes: 'Consulta psiquiátrica', user_id: users[6].id, doctor_id: doctors[6].id },
            { date: '2025-03-31', time: '11:30:00', notes: 'Consulta neurológica', user_id: users[7].id, doctor_id: doctors[7].id },
            { date: '2025-04-01', time: '13:00:00', notes: 'Exame radiológico de imagem', user_id: users[8].id, doctor_id: doctors[8].id },
            { date: '2025-04-01', time: '14:30:00', notes: 'Consulta urológica', user_id: users[9].id, doctor_id: doctors[9].id },
            { date: '2025-04-02', time: '09:00:00', notes: 'Acompanhamento endocrinológico', user_id: users[10].id, doctor_id: doctors[10].id },
            { date: '2025-04-02', time: '10:30:00', notes: 'Exame geriátrico', user_id: users[11].id, doctor_id: doctors[11].id },
            { date: '2025-04-03', time: '08:00:00', notes: 'Consulta oncologia', user_id: users[12].id, doctor_id: doctors[12].id },
            { date: '2025-04-03', time: '09:30:00', notes: 'Avaliação reumatológica', user_id: users[13].id, doctor_id: doctors[13].id },
            { date: '2025-04-04', time: '11:00:00', notes: 'Consulta gastroenterológica', user_id: users[14].id, doctor_id: doctors[14].id },
            { date: '2025-04-04', time: '12:00:00', notes: 'Avaliação de infecções', user_id: users[15].id, doctor_id: doctors[15].id },
            { date: '2025-04-05', time: '10:00:00', notes: 'Consulta otorrinolaringológica', user_id: users[16].id, doctor_id: doctors[16].id },
            { date: '2025-04-05', time: '11:00:00', notes: 'Consulta cirurgia geral', user_id: users[17].id, doctor_id: doctors[17].id },
            { date: '2025-04-06', time: '13:30:00', notes: 'Exame anestesiológico', user_id: users[18].id, doctor_id: doctors[18].id },
            { date: '2025-04-06', time: '15:00:00', notes: 'Consulta de rotina', user_id: users[19].id, doctor_id: doctors[19].id },
            { date: '2025-04-07', time: '10:00:00', notes: 'Consulta pediátrica', user_id: users[0].id, doctor_id: doctors[2].id },
            { date: '2025-04-07', time: '11:30:00', notes: 'Acompanhamento ginecológico', user_id: users[1].id, doctor_id: doctors[3].id },
            { date: '2025-04-08', time: '14:00:00', notes: 'Consulta dermatológica', user_id: users[2].id, doctor_id: doctors[4].id },
            { date: '2025-04-08', time: '15:30:00', notes: 'Exame oftalmológico', user_id: users[3].id, doctor_id: doctors[5].id },
            { date: '2025-04-09', time: '09:00:00', notes: 'Avaliação psiquiátrica', user_id: users[4].id, doctor_id: doctors[6].id },
            { date: '2025-04-09', time: '10:30:00', notes: 'Consulta neurológica', user_id: users[5].id, doctor_id: doctors[7].id },
            { date: '2025-04-10', time: '13:00:00', notes: 'Exame radiológico de imagem', user_id: users[6].id, doctor_id: doctors[8].id },
            { date: '2025-04-10', time: '14:30:00', notes: 'Consulta urológica', user_id: users[7].id, doctor_id: doctors[9].id },
            { date: '2025-04-11', time: '08:30:00', notes: 'Acompanhamento endocrinológico', user_id: users[8].id, doctor_id: doctors[10].id },
            { date: '2025-04-11', time: '10:00:00', notes: 'Exame geriátrico', user_id: users[9].id, doctor_id: doctors[11].id },
            { date: '2025-04-12', time: '13:30:00', notes: 'Consulta oncologia', user_id: users[10].id, doctor_id: doctors[12].id },
            { date: '2025-04-12', time: '15:00:00', notes: 'Avaliação reumatológica', user_id: users[11].id, doctor_id: doctors[13].id },
            { date: '2025-04-13', time: '09:00:00', notes: 'Consulta gastroenterológica', user_id: users[12].id, doctor_id: doctors[14].id },
            { date: '2025-04-13', time: '10:00:00', notes: 'Avaliação de infecções', user_id: users[13].id, doctor_id: doctors[15].id },
            { date: '2025-04-14', time: '11:30:00', notes: 'Consulta otorrinolaringológica', user_id: users[14].id, doctor_id: doctors[16].id },
            { date: '2025-04-14', time: '13:00:00', notes: 'Consulta cirurgia geral', user_id: users[15].id, doctor_id: doctors[17].id },
            { date: '2025-04-15', time: '09:30:00', notes: 'Exame anestesiológico', user_id: users[16].id, doctor_id: doctors[18].id },
            { date: '2025-04-15', time: '10:30:00', notes: 'Consulta de rotina', user_id: users[17].id, doctor_id: doctors[19].id },
            { date: '2025-04-16', time: '09:00:00', notes: 'Consulta pediátrica de rotina', user_id: users[1].id, doctor_id: doctors[3].id },
            { date: '2025-04-16', time: '10:00:00', notes: 'Acompanhamento ginecológico de rotina', user_id: users[2].id, doctor_id: doctors[4].id },
            { date: '2025-04-16', time: '11:00:00', notes: 'Consulta dermatológica de rotina', user_id: users[3].id, doctor_id: doctors[5].id },
            { date: '2025-04-16', time: '12:30:00', notes: 'Exame oftalmológico de rotina', user_id: users[4].id, doctor_id: doctors[6].id },
            { date: '2025-04-16', time: '14:00:00', notes: 'Avaliação psiquiátrica de rotina', user_id: users[5].id, doctor_id: doctors[7].id },
            { date: '2025-04-16', time: '15:30:00', notes: 'Consulta neurológica de rotina', user_id: users[6].id, doctor_id: doctors[8].id },
            { date: '2025-04-16', time: '09:30:00', notes: 'Exame radiológico de rotina', user_id: users[7].id, doctor_id: doctors[9].id },
            { date: '2025-04-16', time: '11:00:00', notes: 'Consulta urológica de rotina', user_id: users[8].id, doctor_id: doctors[10].id },
            { date: '2025-04-16', time: '12:30:00', notes: 'Acompanhamento endocrinológico de rotina', user_id: users[9].id, doctor_id: doctors[11].id },
            { date: '2025-04-16', time: '14:00:00', notes: 'Exame geriátrico de rotina', user_id: users[10].id, doctor_id: doctors[12].id },
            { date: '2025-04-16', time: '15:30:00', notes: 'Consulta oncologia de rotina', user_id: users[11].id, doctor_id: doctors[13].id },
            { date: '2025-04-16', time: '09:00:00', notes: 'Avaliação reumatológica de rotina', user_id: users[12].id, doctor_id: doctors[14].id },
            { date: '2025-04-16', time: '10:30:00', notes: 'Consulta gastroenterológica de rotina', user_id: users[13].id, doctor_id: doctors[15].id },
            { date: '2025-04-16', time: '12:00:00', notes: 'Avaliação de infecções de rotina', user_id: users[14].id, doctor_id: doctors[16].id },
            { date: '2025-04-16', time: '13:30:00', notes: 'Consulta otorrinolaringológica de rotina', user_id: users[15].id, doctor_id: doctors[17].id },
            { date: '2025-04-16', time: '15:00:00', notes: 'Consulta cirurgia geral de rotina', user_id: users[16].id, doctor_id: doctors[18].id },
            { date: '2025-04-16', time: '09:00:00', notes: 'Exame anestesiológico de rotina', user_id: users[17].id, doctor_id: doctors[19].id },
            { date: '2025-04-16', time: '10:00:00', notes: 'Consulta de rotina de acompanhamento', user_id: users[18].id, doctor_id: doctors[1].id },
            { date: '2025-04-16', time: '11:30:00', notes: 'Consulta pediátrica de acompanhamento', user_id: users[19].id, doctor_id: doctors[2].id },
            { date: '2025-04-16', time: '13:00:00', notes: 'Acompanhamento ginecológico de acompanhamento', user_id: users[20].id, doctor_id: doctors[3].id },
            { date: '2025-04-16', time: '14:30:00', notes: 'Consulta dermatológica de acompanhamento', user_id: users[1].id, doctor_id: doctors[4].id },
            { date: '2025-04-16', time: '09:00:00', notes: 'Exame oftalmológico de acompanhamento', user_id: users[2].id, doctor_id: doctors[5].id },
            { date: '2025-04-16', time: '10:00:00', notes: 'Avaliação psiquiátrica de acompanhamento', user_id: users[3].id, doctor_id: doctors[6].id },
            { date: '2025-04-16', time: '11:30:00', notes: 'Consulta neurológica de acompanhamento', user_id: users[4].id, doctor_id: doctors[7].id },
            { date: '2025-04-16', time: '12:00:00', notes: 'Consulta pediátrica de acompanhamento', user_id: users[2].id, doctor_id: doctors[3].id },
            { date: '2025-04-16', time: '13:00:00', notes: 'Exame radiológico de acompanhamento', user_id: users[5].id, doctor_id: doctors[8].id },
            { date: '2025-04-16', time: '14:30:00', notes: 'Consulta urológica de acompanhamento', user_id: users[6].id, doctor_id: doctors[9].id },
            { date: '2025-04-16', time: '15:00:00', notes: 'Acompanhamento endocrinológico de acompanhamento', user_id: users[7].id, doctor_id: doctors[10].id },
            { date: '2025-04-16', time: '09:30:00', notes: 'Exame geriátrico de acompanhamento', user_id: users[8].id, doctor_id: doctors[11].id },
            { date: '2025-04-16', time: '11:00:00', notes: 'Consulta oncologia de acompanhamento', user_id: users[9].id, doctor_id: doctors[12].id },
            { date: '2025-04-16', time: '12:30:00', notes: 'Avaliação reumatológica de acompanhamento', user_id: users[10].id, doctor_id: doctors[13].id },
            { date: '2025-04-16', time: '14:00:00', notes: 'Consulta gastroenterológica de acompanhamento', user_id: users[11].id, doctor_id: doctors[14].id },

        ];

        await Appointment.bulkCreate(appointmentsData);
        console.log('Consultas (Appointments) inseridas.');

        console.log('Seeding da base de dados concluído!');
    } catch (error) {
        console.error('Erro durante o seeding:', error);
    } finally {
        //await sequelize.close();
        console.log('Conexão com a base de dados fechada.');
    }
}

module.exports = seedDatabase;