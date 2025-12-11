import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material imports
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// Services
import { ServicioService } from '../../core/services/servicio.service';
import { ProductosService } from '../../core/services/productos.service';
import { AuthService } from '../../core/services/auth.service';
import { BusquedaService } from '../../core/services/busqueda.service';

// Interfaces
import { Servicio } from '../../interfaces/servicio.interface';
import { Producto } from '../../interfaces/producto.interface';

// Componentes de diálogo
import { CrearEditarServicioDialogComponent } from '../../components/crear-editar-servicio-dialog/crear-editar-servicio-dialog.component';
import { CrearEditarProductoDialogComponent } from '../../components/crear-editar-producto-dialog/crear-editar-producto-dialog.component';

@Component({
    selector: 'app-configuracion-completa',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MatTabsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatTableModule,
        MatChipsModule,
        MatMenuModule,
        MatFormFieldModule,
        MatInputModule
    ],
    templateUrl: './configuracion-completa.page.html',
    styleUrls: ['./configuracion-completa.page.scss']
})
export class ConfiguracionCompletaPage implements OnInit {
    // Datos de servicios
    servicios: Servicio[] = [];
    serviciosFiltrados: Servicio[] = [];
    serviciosActivos: Servicio[] = [];
    serviciosInactivos: Servicio[] = [];
    serviciosLoading = true;
    serviciosError: string | null = null;
    terminoBusquedaServicios: string = '';
    sugerenciasServicios: string[] = [];
    mostrarSugerenciasServicios: boolean = false;

    // Datos de productos
    productos: Producto[] = [];
    productosFiltrados: Producto[] = [];
    productosActivos: Producto[] = [];
    productosInactivos: Producto[] = [];
    productosLoading = true;
    productosError: string | null = null;
    terminoBusquedaProductos: string = '';
    sugerenciasProductos: string[] = [];
    mostrarSugerenciasProductos: boolean = false;

    // Usuario actual
    usuario: any = null;

    // Columnas para las tablas
    serviciosColumns: string[] = ['nombre', 'categoria', 'duracion', 'precio', 'acciones'];
    productosColumns: string[] = ['nombre', 'precio', 'stock', 'acciones'];

    constructor(
        private servicioService: ServicioService,
        private productosService: ProductosService,
        private busquedaService: BusquedaService,
        private authService: AuthService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit() {
        this.cargarUsuario();
        this.cargarServicios();
        this.cargarProductos();
    }

    cargarUsuario() {
        this.authService.usuarioActual$.subscribe(usuario => {
            this.usuario = usuario;
        });
    }

    // ====================
    // MÉTODOS AUXILIARES
    // ====================

    private separarServiciosPorEstado() {
        this.serviciosActivos = this.serviciosFiltrados.filter(s => s.activo);
        this.serviciosInactivos = this.serviciosFiltrados.filter(s => !s.activo);
    }

    private separarProductosPorEstado() {
        this.productosActivos = this.productosFiltrados.filter(p => p.activo);
        this.productosInactivos = this.productosFiltrados.filter(p => !p.activo);
    }

    // ====================
    // GESTIÓN DE SERVICIOS
    // ====================

    cargarServicios() {
        this.serviciosLoading = true;
        this.serviciosError = null;

        this.servicioService.getTodosServicios().subscribe({
            next: (servicios) => {
                this.servicios = servicios;
                this.serviciosFiltrados = servicios;
                this.separarServiciosPorEstado();
                this.serviciosLoading = false;
                console.log('✅ Todos los servicios cargados:', servicios.length);
                console.log(`📊 Activos: ${this.serviciosActivos.length}, Inactivos: ${this.serviciosInactivos.length}`);
            },
            error: (error) => {
                this.serviciosError = 'Error al cargar los servicios';
                this.serviciosLoading = false;
                console.error('❌ Error cargando servicios:', error);
                this.mostrarError('Error al cargar los servicios');
            }
        });
    }

    onBuscarServiciosChange() {
        if (this.terminoBusquedaServicios.length > 2 && this.servicios.length > 0) {
            this.mostrarSugerenciasServicios = true;
            this.sugerenciasServicios = this.servicios
                .filter(s => s && s.nombre && s.nombre.toLowerCase().includes(this.terminoBusquedaServicios.toLowerCase()))
                .map(s => s.nombre)
                .slice(0, 5);
        } else {
            this.mostrarSugerenciasServicios = false;
            this.sugerenciasServicios = [];
        }
    }

    buscarServicios() {
        if (!this.terminoBusquedaServicios.trim()) {
            this.serviciosFiltrados = this.servicios;
            this.separarServiciosPorEstado();
            this.mostrarSugerenciasServicios = false;
            return;
        }

        this.busquedaService.buscarServicios(this.terminoBusquedaServicios).subscribe({
            next: (response) => {
                this.serviciosFiltrados = response.servicios || [];
                this.separarServiciosPorEstado();
                console.log('🔍 Resultados búsqueda servicios:', this.serviciosFiltrados.length);
                this.mostrarSugerenciasServicios = false;
            },
            error: (error) => {
                console.error('❌ Error buscando servicios:', error);
                this.filtrarServiciosLocalmente();
                this.mostrarSugerenciasServicios = false;
            }
        });
    }

    seleccionarSugerenciaServicios(sugerencia: string) {
        this.terminoBusquedaServicios = sugerencia;
        this.buscarServicios();
    }

    filtrarServiciosLocalmente() {
        const termino = this.terminoBusquedaServicios.toLowerCase().trim();
        this.serviciosFiltrados = this.servicios.filter(servicio =>
            servicio.nombre.toLowerCase().includes(termino) ||
            (servicio.descripcion && servicio.descripcion.toLowerCase().includes(termino)) ||
            servicio.categoria.toLowerCase().includes(termino)
        );
        this.separarServiciosPorEstado();
    }

    limpiarBusquedaServicios() {
        this.terminoBusquedaServicios = '';
        this.serviciosFiltrados = this.servicios;
        this.separarServiciosPorEstado();
        this.mostrarSugerenciasServicios = false;
        this.sugerenciasServicios = [];
    }

    crearServicio() {
        const dialogRef = this.dialog.open(CrearEditarServicioDialogComponent, {
            width: '600px',
            data: {}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.servicioService.crearServicio(result).subscribe({
                    next: (response) => {
                        this.mostrarExito('Servicio creado correctamente');
                        this.cargarServicios();
                    },
                    error: (error) => {
                        console.error('Error creando servicio:', error);
                        this.mostrarError('Error al crear el servicio');
                    }
                });
            }
        });
    }

    editarServicio(servicio: Servicio) {
        const dialogRef = this.dialog.open(CrearEditarServicioDialogComponent, {
            width: '600px',
            data: { servicio }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.servicioService.actualizarServicio(servicio.id, result).subscribe({
                    next: (response) => {
                        this.mostrarExito('Servicio actualizado correctamente');
                        this.cargarServicios();
                    },
                    error: (error) => {
                        console.error('Error actualizando servicio:', error);
                        this.mostrarError('Error al actualizar el servicio');
                    }
                });
            }
        });
    }

    eliminarServicio(servicio: Servicio) {
        if (confirm(`¿Estás seguro de que deseas eliminar el servicio "${servicio.nombre}"?`)) {
            this.servicioService.eliminarServicio(servicio.id).subscribe({
                next: () => {
                    this.mostrarExito('Servicio eliminado correctamente');
                    this.cargarServicios();
                },
                error: (error) => {
                    console.error('❌ Error eliminando servicio:', error);
                    this.mostrarError('Error al eliminar el servicio');
                }
            });
        }
    }

    // ====================
    // GESTIÓN DE PRODUCTOS
    // ====================

    cargarProductos() {
        this.productosLoading = true;
        this.productosError = null;

        this.productosService.getTodosProductos().subscribe({
            next: (productos) => {
                this.productos = productos;
                this.productosFiltrados = productos;
                this.separarProductosPorEstado();
                this.productosLoading = false;
                console.log('✅ Todos los productos cargados:', productos.length);
                console.log(`📊 Productos activos: ${this.productosActivos.length}, inactivos: ${this.productosInactivos.length}`);
            },
            error: (error) => {
                this.productosError = 'Error al cargar los productos';
                this.productosLoading = false;
                console.error('❌ Error cargando productos:', error);
                this.mostrarError('Error al cargar los productos');
            }
        });
    }

    onBuscarProductosChange() {
        if (this.terminoBusquedaProductos.length > 2 && this.productos.length > 0) {
            this.mostrarSugerenciasProductos = true;
            this.sugerenciasProductos = this.productos
                .filter(p => p && p.nombre && p.nombre.toLowerCase().includes(this.terminoBusquedaProductos.toLowerCase()))
                .map(p => p.nombre)
                .slice(0, 5);
        } else {
            this.mostrarSugerenciasProductos = false;
            this.sugerenciasProductos = [];
        }
    }

    buscarProductos() {
        if (!this.terminoBusquedaProductos.trim()) {
            this.productosFiltrados = this.productos;
            this.separarProductosPorEstado();
            this.mostrarSugerenciasProductos = false;
            return;
        }

        this.busquedaService.buscarProductos(this.terminoBusquedaProductos).subscribe({
            next: (response) => {
                this.productosFiltrados = response.productos || [];
                this.separarProductosPorEstado();
                console.log('🔍 Resultados búsqueda productos:', this.productosFiltrados.length);
                this.mostrarSugerenciasProductos = false;
            },
            error: (error) => {
                console.error('❌ Error buscando productos:', error);
                this.filtrarProductosLocalmente();
                this.mostrarSugerenciasProductos = false;
            }
        });
    }

    seleccionarSugerenciaProductos(sugerencia: string) {
        this.terminoBusquedaProductos = sugerencia;
        this.buscarProductos();
    }

    filtrarProductosLocalmente() {
        const termino = this.terminoBusquedaProductos.toLowerCase().trim();
        this.productosFiltrados = this.productos.filter(producto =>
            producto.nombre.toLowerCase().includes(termino)
        );
        this.separarProductosPorEstado();
    }

    limpiarBusquedaProductos() {
        this.terminoBusquedaProductos = '';
        this.productosFiltrados = this.productos;
        this.separarProductosPorEstado();
        this.mostrarSugerenciasProductos = false;
        this.sugerenciasProductos = [];
    }

    crearProducto() {
        const dialogRef = this.dialog.open(CrearEditarProductoDialogComponent, {
            width: '600px',
            data: {}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.productosService.crearProducto(result).subscribe({
                    next: (response) => {
                        this.mostrarExito('Producto creado correctamente');
                        this.cargarProductos();
                    },
                    error: (error) => {
                        console.error('Error creando producto:', error);
                        this.mostrarError('Error al crear el producto');
                    }
                });
            }
        });
    }

    editarProducto(producto: Producto) {
        const dialogRef = this.dialog.open(CrearEditarProductoDialogComponent, {
            width: '600px',
            data: { producto }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.productosService.actualizarProducto(producto.id, result).subscribe({
                    next: (response) => {
                        this.mostrarExito('Producto actualizado correctamente');
                        this.cargarProductos();
                    },
                    error: (error) => {
                        console.error('Error actualizando producto:', error);
                        this.mostrarError('Error al actualizar el producto');
                    }
                });
            }
        });
    }

    eliminarProducto(producto: Producto) {
        if (confirm(`¿Estás seguro de que deseas eliminar el producto "${producto.nombre}"?`)) {
            this.productosService.eliminarProducto(producto.id).subscribe({
                next: () => {
                    this.mostrarExito('Producto eliminado correctamente');
                    this.cargarProductos();
                },
                error: (error) => {
                    console.error('❌ Error eliminando producto:', error);
                    this.mostrarError('Error al eliminar el producto');
                }
            });
        }
    }

    // ====================
    // UTILIDADES
    // ====================

    mostrarExito(mensaje: string) {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-success']
        });
    }

    mostrarError(mensaje: string) {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
        });
    }

    mostrarInfo(mensaje: string) {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 3000
        });
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    getCategoriaColor(categoria: string): string {
        const colores: { [key: string]: string } = {
            'corte': 'primary',
            'color': 'accent',
            'tratamiento': 'warn',
            'cejas': 'primary',
            'unas': 'accent',
            'default': 'basic'
        };
        return colores[categoria.toLowerCase()] || colores['default'];
    }

    getEstadoColor(activo: boolean): string {
        return activo ? 'primary' : 'warn';
    }

    getEstadoText(activo: boolean): string {
        return activo ? 'Activo' : 'Inactivo';
    }

    get isAdministrador(): boolean {
        return this.usuario?.rol === 'administrador';
    }

    volverAlDashboard() {
        window.history.back();
    }

    getCategoriasUnicas(): string[] {
        const categorias = this.servicios.map(s => s.categoria);
        return [...new Set(categorias)];
    }

    getTotalStock(): number {
        return this.productosActivos.reduce((total, producto) => total + producto.stock, 0);
    }
}