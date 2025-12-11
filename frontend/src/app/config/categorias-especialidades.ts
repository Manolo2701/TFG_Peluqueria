export interface CategoriaConfig {
    id: string;
    label: string;
}

export interface EspecialidadConfig {
    id: string;
    label: string;
    categoriaId: string;
}

export const CATEGORIAS: CategoriaConfig[] = [
    { id: 'Peluquería', label: 'Peluquería' },
    { id: 'Estética', label: 'Estética' }
];

export const ESPECIALIDADES: EspecialidadConfig[] = [
    { id: 'Cortes de cabello', label: 'Cortes de cabello', categoriaId: 'Peluquería' },
    { id: 'Coloración', label: 'Coloración', categoriaId: 'Peluquería' },
    { id: 'Mechas', label: 'Mechas', categoriaId: 'Peluquería' },
    { id: 'Tratamientos capilares', label: 'Tratamientos capilares', categoriaId: 'Peluquería' },
    { id: 'Peinados', label: 'Peinados', categoriaId: 'Peluquería' },

    { id: 'Maquillaje', label: 'Maquillaje', categoriaId: 'Estética' },
    { id: 'Depilación', label: 'Depilación', categoriaId: 'Estética' },
    { id: 'Cuidado facial', label: 'Cuidado facial', categoriaId: 'Estética' },
    { id: 'Uñas', label: 'Uñas', categoriaId: 'Estética' },
    { id: 'Masajes relajantes', label: 'Masajes relajantes', categoriaId: 'Estética' },
    { id: 'Masajes terapéuticos', label: 'Masajes terapéuticos', categoriaId: 'Estética' }
];
