class CalendarioUtils {
    // ✅ FUNCIÓN MUY SIMPLIFICADA - Solo verificar categorías básicas
    static puedeRealizarServicio(trabajador, servicio) {
        try {
            console.log('🔍 [CATEGORÍA] VALIDACIÓN SIMPLIFICADA:');
            console.log('   Trabajador:', trabajador.nombre, '- Categoría:', trabajador.categoria);
            console.log('   Servicio:', servicio.nombre, '- Categoría:', servicio.categoria);

            // Normalizar categorías
            const categoriaTrabajador = this.normalizarTexto(trabajador.categoria);
            const categoriaServicio = this.normalizarTexto(servicio.categoria);

            // ✅ LÓGICA MUY SIMPLE:
            let resultado = false;

            if (categoriaTrabajador === 'ambas') {
                resultado = true;
                console.log('   ✅ Trabajador con categoría "Ambas" - PUEDE realizar cualquier servicio');
            } 
            else if (categoriaTrabajador === categoriaServicio) {
                resultado = true;
                console.log('   ✅ Categorías coinciden - PUEDE realizar el servicio');
            }
            else if (categoriaServicio.includes(categoriaTrabajador) || categoriaTrabajador.includes(categoriaServicio)) {
                resultado = true;
                console.log('   ✅ Categorías compatibles - PUEDE realizar el servicio');
            }
            else {
                console.log('   ❌ Categorías NO coinciden - NO PUEDE realizar el servicio');
                resultado = false;
            }

            console.log(`🎯 RESULTADO FINAL: ${resultado ? '✅ PUEDE' : '❌ NO PUEDE'}`);
            return resultado;

        } catch (error) {
            console.error('❌ Error en puedeRealizarServicio:', error);
            return false;
        }
    }

    static normalizarTexto(texto) {
        if (!texto) return '';
        return texto.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9 ]/g, '')
            .trim();
    }

    static filtrarTrabajadoresPorCategoria(trabajadores, categoriaServicio) {
        console.log(`🔍 Filtrando ${trabajadores.length} trabajadores por categoría: ${categoriaServicio}`);
        const trabajadoresFiltrados = trabajadores.filter(trabajador => {
            const puede = this.puedeRealizarServicio(trabajador, { categoria: categoriaServicio });
            console.log(`   ${trabajador.nombre} (${trabajador.categoria}): ${puede ? '✅' : '❌'}`);
            return puede;
        });
        console.log(`📊 Trabajadores después del filtro: ${trabajadoresFiltrados.length}`);
        return trabajadoresFiltrados;
    }


    static normalizarHorarioLaboral(horarioLaboral) {
        try {
            if (typeof horarioLaboral === 'string') {
                horarioLaboral = JSON.parse(horarioLaboral);
            }

            const horarioNormalizado = {};
            const mapeoDias = {
                'lunes': 'lunes', 'Lunes': 'lunes', 'LUNES': 'lunes',
                'martes': 'martes', 'Martes': 'martes', 'MARTES': 'martes',
                'miercoles': 'miercoles', 'Miercoles': 'miercoles', 'MIERCOLES': 'miercoles',
                'miércoles': 'miercoles', 'Miércoles': 'miercoles', 'MIÉRCOLES': 'miercoles',
                'jueves': 'jueves', 'Jueves': 'jueves', 'JUEVES': 'jueves',
                'viernes': 'viernes', 'Viernes': 'viernes', 'VIERNES': 'viernes',
                'sabado': 'sabado', 'Sabado': 'sabado', 'SABADO': 'sabado',
                'sábado': 'sabado', 'Sábado': 'sabado', 'SÁBADO': 'sabado',
                'domingo': 'domingo', 'Domingo': 'domingo', 'DOMINGO': 'domingo'
            };

            Object.keys(horarioLaboral).forEach(diaOriginal => {
                const diaNormalizado = mapeoDias[diaOriginal] || diaOriginal.toLowerCase();
                horarioNormalizado[diaNormalizado] = horarioLaboral[diaOriginal];
            });

            return horarioNormalizado;
        } catch (error) {
            console.error('Error normalizando horario laboral:', error);
            return {};
        }
    }

    static obtenerHorarioParaDia(horarioLaboral, diaSemana) {
        try {
            if (!horarioLaboral) return null;

            const horarioNormalizado = this.normalizarHorarioLaboral(horarioLaboral);
            const diaNormalizado = diaSemana.toLowerCase();

            return horarioNormalizado[diaNormalizado] || null;
        } catch (error) {
            console.error('Error obteniendo horario para día:', error);
            return null;
        }
    }

    static generarSlotsDisponibles(horarioLaboral, reservasExistentes, duracionServicio) {
        const slotsDisponibles = [];
        const duracionMinutos = parseInt(duracionServicio);

        if (!horarioLaboral || !horarioLaboral.inicio || !horarioLaboral.fin) {
            return slotsDisponibles;
        }

        const [horaInicio, minutoInicio] = horarioLaboral.inicio.split(':').map(Number);
        const [horaFin, minutoFin] = horarioLaboral.fin.split(':').map(Number);

        const inicioTotalMinutos = horaInicio * 60 + minutoInicio;
        const finTotalMinutos = horaFin * 60 + minutoFin;

        //  CORRECCIÓN: Cambiar inicioTotalMinicios por inicioTotalMinutos
        for (let minutosActual = inicioTotalMinutos; minutosActual <= finTotalMinutos - duracionMinutos; minutosActual += 15) {
            const horaSlot = Math.floor(minutosActual / 60);
            const minutoSlot = minutosActual % 60;
            const horaFinSlot = Math.floor((minutosActual + duracionMinutos) / 60);
            const minutoFinSlot = (minutosActual + duracionMinutos) % 60;

            const slotInicio = `${horaSlot.toString().padStart(2, '0')}:${minutoSlot.toString().padStart(2, '0')}`;
            const slotFin = `${horaFinSlot.toString().padStart(2, '0')}:${minutoFinSlot.toString().padStart(2, '0')}`;

            const solapado = reservasExistentes.some(reserva => {
                return this.haySolapamiento(slotInicio, duracionMinutos, reserva.hora_inicio, reserva.duracion);
            });

            if (!solapado) {
                slotsDisponibles.push({
                    hora_inicio: slotInicio,
                    hora_fin: slotFin,
                    duracion: duracionMinutos
                });
            }
        }

        return slotsDisponibles;
    }

    static async esHorarioLaboralNegocio(fecha, hora, configuracionNegocio) {
        try {
            if (!configuracionNegocio) return true;

            const diaSemana = this.obtenerDiaSemana(fecha);

            if (!configuracionNegocio.dias_apertura.includes(diaSemana)) {
                return false;
            }

            const Configuracion = require('../models/Configuracion');
            const esFestivo = await Configuracion.esFestivo(fecha);
            if (esFestivo) {
                return false;
            }

            const [horaActual, minutoActual] = hora.split(':').map(Number);
            const [horaApertura, minutoApertura] = configuracionNegocio.horario_apertura.split(':').map(Number);
            const [horaCierre, minutoCierre] = configuracionNegocio.horario_cierre.split(':').map(Number);

            const minutosActual = horaActual * 60 + minutoActual;
            const minutosApertura = horaApertura * 60 + minutoApertura;
            const minutosCierre = horaCierre * 60 + minutoCierre;

            return minutosActual >= minutosApertura && minutosActual <= minutosCierre;

        } catch (error) {
            console.error('Error verificando horario laboral del negocio:', error);
            return true;
        }
    }

    static async generarSlotsDisponiblesConConfiguracion(horarioLaboral, reservasExistentes, duracionServicio, fecha, configuracionNegocio) {
        const slotsDisponibles = [];
        const duracionMinutos = parseInt(duracionServicio);

        if (!horarioLaboral || !horarioLaboral.inicio || !horarioLaboral.fin) {
            return slotsDisponibles;
        }

        const [horaInicio, minutoInicio] = horarioLaboral.inicio.split(':').map(Number);
        const [horaFin, minutoFin] = horarioLaboral.fin.split(':').map(Number);

        const inicioTotalMinutos = horaInicio * 60 + minutoInicio;
        const finTotalMinutos = horaFin * 60 + minutoFin;

        for (let minutosActual = inicioTotalMinutos; minutosActual <= finTotalMinutos - duracionMinutos; minutosActual += 15) {
            const horaSlot = Math.floor(minutosActual / 60);
            const minutoSlot = minutosActual % 60;
            const horaFinSlot = Math.floor((minutosActual + duracionMinutos) / 60);
            const minutoFinSlot = (minutosActual + duracionMinutos) % 60;

            const slotInicio = `${horaSlot.toString().padStart(2, '0')}:${minutoSlot.toString().padStart(2, '0')}`;
            const slotFin = `${horaFinSlot.toString().padStart(2, '0')}:${minutoFinSlot.toString().padStart(2, '0')}`;

            const esHorarioValido = await this.esHorarioLaboralNegocio(fecha, slotInicio, configuracionNegocio);
            if (!esHorarioValido) {
                continue;
            }

            const solapado = reservasExistentes.some(reserva => {
                return this.haySolapamiento(slotInicio, duracionMinutos, reserva.hora_inicio, reserva.duracion);
            });

            if (!solapado) {
                slotsDisponibles.push({
                    hora_inicio: slotInicio,
                    hora_fin: slotFin,
                    duracion: duracionMinutos
                });
            }
        }

        return slotsDisponibles;
    }

    static haySolapamiento(inicio1, duracion1, inicio2, duracion2) {
        const [horaInicio1, minutoInicio1] = inicio1.split(':').map(Number);
        const [horaInicio2, minutoInicio2] = inicio2.split(':').map(Number);

        const minutosInicio1 = horaInicio1 * 60 + minutoInicio1;
        const minutosFin1 = minutosInicio1 + parseInt(duracion1);
        const minutosInicio2 = horaInicio2 * 60 + minutoInicio2;
        const minutosFin2 = minutosInicio2 + parseInt(duracion2);

        return minutosInicio1 < minutosFin2 && minutosFin1 > minutosInicio2;
    }

    static obtenerDiaSemana(fecha) {
        const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const fechaObj = new Date(fecha);
        return dias[fechaObj.getDay()];
    }

    static esFechaValidaParaReserva(fecha) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaReserva = new Date(fecha);
        return fechaReserva >= hoy;
    }
}

module.exports = CalendarioUtils;
