import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

// FontAwesome
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

// Services
import { TrabajadorService } from '../../core/services/trabajador.service';

// Components
import { HistorialClienteModalComponent } from '../../components/historial-cliente-modal/historial-cliente-modal.component';

interface Cliente {
    id: number;
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    totalReservas: number;
    ultimaVisita: string;
    serviciosUtilizados: string[];
}

@Component({
    selector: 'app-mis-clientes',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        FontAwesomeModule
    ],
    templateUrl: './mis-clientes.page.html',
    styleUrls: ['./mis-clientes.page.scss']
})
export class MisClientesPage implements OnInit {
    clientes: Cliente[] = [];
    loading = false;
    error: string | null = null;

    // Definir la propiedad para el icono de WhatsApp
    faWhatsapp = faWhatsapp;

    constructor(
        private trabajadorService: TrabajadorService,
        private snackBar: MatSnackBar,
        private library: FaIconLibrary,
        private dialog: MatDialog
    ) {
        // Registrar el icono de WhatsApp en la librería
        library.addIcons(faWhatsapp);
    }

    ngOnInit() {
        this.cargarClientes();
    }

    cargarClientes() {
        this.loading = true;
        this.error = null;

        this.trabajadorService.obtenerMisClientes().subscribe({
            next: (response) => {
                // ✅ CORRECCIÓN: Convertir totalReservas a número
                this.clientes = response.clientes.map((cliente: any) => ({
                    id: cliente.id,
                    nombre: cliente.nombre,
                    apellidos: cliente.apellidos,
                    email: cliente.email,
                    telefono: cliente.telefono,
                    totalReservas: Number(cliente.totalReservas) || 0, // ← CONVERTIR A NÚMERO
                    ultimaVisita: cliente.ultimaVisita,
                    serviciosUtilizados: cliente.serviciosUtilizados || []
                }));
                this.loading = false;
                console.log('✅ Clientes cargados:', this.clientes);
            },
            error: (err) => {
                this.error = err.message;
                this.loading = false;
                console.error('❌ Error cargando clientes:', err);
                this.mostrarError(err.message);
            }
        });
    }

    getTotalReservas(): number {
        return this.clientes.reduce((total, cliente) => total + cliente.totalReservas, 0);
    }

    verHistorial(cliente: Cliente) {
        console.log('Ver historial de:', cliente);

        const dialogRef = this.dialog.open(HistorialClienteModalComponent, {
            width: '900px',
            maxWidth: '95vw',
            maxHeight: '85vh',
            data: { cliente }
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('Modal de historial cerrado');
        });
    }

    contactarCliente(cliente: Cliente) {
        console.log('Contactar a:', cliente);

        if (cliente.telefono) {
            // Abrir WhatsApp
            const mensaje = `Hola ${cliente.nombre}, soy de Peluquería Selene.`;
            const url = `https://wa.me/${cliente.telefono}?text=${encodeURIComponent(mensaje)}`;
            window.open(url, '_blank');
        } else {
            this.mostrarError('No hay número de teléfono disponible para este cliente');
        }
    }

    llamarCliente(cliente: Cliente) {
        if (cliente.telefono) {
            window.open(`tel:${cliente.telefono}`, '_self');
        } else {
            this.mostrarError('No hay número de teléfono disponible para este cliente');
        }
    }

    mostrarExito(mensaje: string) {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
        });
    }

    mostrarError(mensaje: string) {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
        });
    }

    formatDate(dateString: string): string {
        if (!dateString) return 'Nunca';
        try {
            return new Date(dateString).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    formatCurrency(amount: any): string {
        const amountNumero = Number(amount);
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(isNaN(amountNumero) ? 0 : amountNumero);
    }
}