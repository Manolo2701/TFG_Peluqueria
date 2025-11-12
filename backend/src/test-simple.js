const Trabajador = require('./models/Trabajador');
const Servicio = require('./models/Servicio');

async function testSimple() {
    try {
        console.log('🧪 TEST SIMPLE DEL SISTEMA');
        
        // 1. Verificar trabajadores
        const trabajadores = await Trabajador.listarTodos();
        console.log('✅ Trabajadores:', trabajadores.length);
        trabajadores.forEach(t => {
            console.log(`   - ${t.nombre} ${t.apellidos} (${t.especialidades})`);
        });
        
        // 2. Verificar servicios
        const servicios = await Servicio.listarTodos();
        console.log('✅ Servicios:', servicios.length);
        servicios.forEach(s => {
            console.log(`   - ${s.nombre} (${s.categoria}) - ${s.duracion}min`);
        });
        
        console.log('🎉 Sistema básico funcionando!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSimple();