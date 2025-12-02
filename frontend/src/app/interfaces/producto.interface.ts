export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  activo: boolean;
}

export interface ProductoBusqueda extends Producto {
  tipo?: string;
  categoria?: string;
  relevancia?: number;
}

export interface CarritoItem {
  producto_id: number;
  cantidad: number;
  producto?: Producto;
  subtotal?: number;
}