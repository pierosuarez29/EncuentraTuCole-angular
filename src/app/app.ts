import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SchoolService,
  Provincia,
  Distrito,
  Nivel,
  School,
} from './services/school';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  title = () => 'Identicole Angular demo';

  // tema claro / oscuro
  isLightTheme = false;

  // filtros
  departamentos = [
    { value: '01', label: 'AMAZONAS' },
    { value: '02', label: 'ÁNCASH' },
    { value: '03', label: 'APURÍMAC' },
    { value: '04', label: 'AREQUIPA' },
    { value: '05', label: 'AYACUCHO' },
    { value: '06', label: 'CAJAMARCA' },
    { value: '07', label: 'CALLAO' },
    { value: '08', label: 'CUSCO' },
    { value: '09', label: 'HUANCAVELICA' },
    { value: '10', label: 'HUÁNUCO' },
    { value: '11', label: 'ICA' },
    { value: '12', label: 'JUNÍN' },
    { value: '13', label: 'LA LIBERTAD' },
    { value: '14', label: 'LAMBAYEQUE' },
    { value: '15', label: 'LIMA' },
    { value: '16', label: 'LORETO' },
    { value: '17', label: 'MADRE DE DIOS' },
    { value: '18', label: 'MOQUEGUA' },
    { value: '19', label: 'PASCO' },
    { value: '20', label: 'PIURA' },
    { value: '21', label: 'PUNO' },
    { value: '22', label: 'SAN MARTÍN' },
    { value: '23', label: 'TACNA' },
    { value: '24', label: 'TUMBES' },
    { value: '25', label: 'UCAYALI' },
  ];

  modalidades = [
    { value: '01', label: 'Educación Básica Regular' },
    { value: '03', label: 'Educación Básica Alternativa' },
    { value: '04', label: 'Educación Básica Especial' },
  ];

  selectedDepto = '01';
  selectedProv = '';
  selectedDist = '';
  selectedModalidad = '';
  selectedNivel = '';

  provincias: Provincia[] = [];
  distritos: Distrito[] = [];
  niveles: Nivel[] = [];

  colegios: School[] = [];
  totalColegios = 0;
  page = 0;          // 0-based
  pageSize = 12;

  mensaje = '';
  error = '';

  // 🔍 texto que escribe el usuario ("kepler", etc.)
  searchTerm: string = '';

  constructor(private schoolService: SchoolService) {
    this.cargarProvincias();
  }

  // helper para limpiar resultados cuando cambias filtros padres
  private resetResultados() {
    this.colegios = [];
    this.totalColegios = 0;
    this.page = 0;
    this.mensaje = '';
    this.error = '';
  }

  // cambiar tema claro/oscuro
  toggleTheme() {
    this.isLightTheme = !this.isLightTheme;
  }

  // ---- UBIGEO ----
  onDepartamentoChange() {
    this.selectedProv = '';
    this.selectedDist = '';
    this.provincias = [];
    this.distritos = [];
    this.resetResultados();
    this.cargarProvincias();
  }

  cargarProvincias() {
    if (!this.selectedDepto) {
      this.provincias = [];
      this.distritos = [];
      return;
    }

    this.schoolService.getProvincias(this.selectedDepto).subscribe({
      next: (data: Provincia[]) => {
        this.provincias = data;
        if (data.length && !this.selectedProv) {
          this.selectedProv = data[0].codprov;
          this.onProvinciaChange();
        }
      },
      error: () => {
        this.error = 'Error cargando provincias (proxy / API).';
      },
    });
  }

  onProvinciaChange() {
    this.selectedDist = '';
    this.distritos = [];
    this.resetResultados();

    if (!this.selectedDepto || !this.selectedProv) {
      return;
    }

    this.schoolService
      .getDistritos(this.selectedDepto, this.selectedProv)
      .subscribe({
        next: (data: Distrito[]) => (this.distritos = data),
        error: () => (this.error = 'Error cargando distritos.'),
      });
  }

  // ---- MODALIDAD / NIVELES ----
  onModalidadChange() {
    this.selectedNivel = '';
    this.niveles = [];
    this.resetResultados();

    if (!this.selectedModalidad) return;

    this.schoolService.getNiveles(this.selectedModalidad).subscribe({
      next: (niveles) => (this.niveles = niveles),
      error: () => (this.error = 'Error cargando niveles'),
    });
  }

  onNivelChange() {
    this.resetResultados();
  }

  // ---- BUSCAR COLEGIOS ----
  buscar() {
    this.mensaje = '';
    this.error = '';
    this.colegios = [];

    const ubicacionTexto = this.getUbicacionTexto();

    // cuando llamas a buscar manualmente, te vas a la primera página
    this.page = 0;

    if (!this.selectedDepto || !this.selectedProv || !this.selectedDist) {
      this.error = 'Selecciona departamento, provincia y distrito.';
      return;
    }

    this.schoolService.buscarColegios({
      coddpto: this.selectedDepto,
      codprov: this.selectedProv,
      coddist: this.selectedDist,
      modalidad: this.selectedModalidad || '',
      nivel: this.selectedNivel || '',
      page: this.page,
      pageSize: this.pageSize,
      texto: this.searchTerm || '',   // para txt_cen_edu (kepler, etc.)
      ubicacionTexto,
    }).subscribe({
      next: (res) => {
        this.colegios = res.resultados;
        this.totalColegios = res.total;
        this.page = res.page;
        this.pageSize = res.pageSize;

        if (this.colegios.length) {
          const start = this.page * this.pageSize + 1;
          const end = this.page * this.pageSize + this.colegios.length;
          this.mensaje = `Mostrando ${start}–${end} de ${this.totalColegios} colegios.`;
        } else {
          this.mensaje = 'No se encontraron colegios con esos filtros.';
        }
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error consultando colegios. Revisa que el proxy esté corriendo.';
      }
    });
  }

  // 👉 ahora simplemente devolvemos la lista que viene del backend.
  // Si quisieras aplicar un filtro local extra (por ejemplo por gestión),
  // aquí podrías hacerlo.
  get filteredColegios(): School[] {
    return this.colegios;
  }

  limpiarBusquedaLocal() {
    this.searchTerm = '';
  }

  limpiar() {
    this.selectedDepto = '01';
    this.selectedProv = '';
    this.selectedDist = '';
    this.selectedModalidad = '';
    this.selectedNivel = '';
    this.provincias = [];
    this.distritos = [];
    this.niveles = [];
    this.searchTerm = '';

    this.resetResultados();
    this.cargarProvincias();
  }

  // ---- Helpers de paginación ----
  get totalPages(): number {
    return this.totalColegios > 0
      ? Math.ceil(this.totalColegios / this.pageSize)
      : 0;
  }

  irAPagina(p: number) {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.buscar();
  }

  paginaAnterior() {
    if (this.page > 0) {
      this.page--;
      this.buscar();
    }
  }

  paginaSiguiente() {
    if (this.page + 1 < this.totalPages) {
      this.page++;
      this.buscar();
    }
  }


  private getUbicacionTexto(): string {
    const dpto = this.departamentos.find(d => d.value === this.selectedDepto)?.label || '';
    const prov = this.provincias.find(p => p.codprov === this.selectedProv)?.nombre || '';
    const dist = this.distritos.find(d => d.coddist === this.selectedDist)?.nombre || '';

    // "TRUJILLO, TRUJILLO, LA LIBERTAD, Perú"
    return [dist, prov, dpto, 'Perú']
      .filter(Boolean)
      .join(', ');
  }


}
