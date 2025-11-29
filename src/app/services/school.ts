import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';

export interface Provincia {
  coddpto: string;
  codprov: string;
  coddist?: string;
  nombre: string;
}

export interface Distrito {
  coddpto: string;
  codprov: string;
  coddist: string;
  nombre: string;
}

export interface Nivel {
  codNivel: string;
  nombre: string;
}

export interface School {
  codModular?: string;
  nombre: string;
  direccion?: string;
  gestion?: string;
  pension?: number;
  estudiantesPorAula?: number;
  nivel?: string;
  modalidad?: string;
  turno?: string;
  alumnado?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  lat?: number;
  lng?: number;
}

export interface SchoolSearchResult {
  total: number;
  page: number;
  pageSize: number;
  resultados: School[];
}

// 👉 params que le mandamos al backend
export interface SchoolSearchParams {
  coddpto: string;
  codprov: string;
  coddist: string;
  modalidad?: string;
  nivel?: string;
  page?: number;
  pageSize?: number;
  texto?: string;          // nombre de colegio
  lat?: number;
  lng?: number;
  ubicacionTexto?: string; // 👈 nuevo
}

@Injectable({ providedIn: 'root' })
export class SchoolService {
  // Proxy Express
  private baseUrl = 'https://indenticole-proxy.onrender.com';

  constructor(private http: HttpClient) { }

  /** Decodifica el array que viene dentro del JWT (mismo formato que Identicole) */
  private decodeArrayFromJwt<T>(token: string): T[] {
    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Token inválido');
    }
    const payload = parts[1];
    const json = atob(payload);
    return JSON.parse(json) as T[];
  }

  /** Provincias por departamento */
  getProvincias(coddpto: string): Observable<Provincia[]> {
    const url = `${this.baseUrl}/api/provincia/${coddpto}`;
    return this.http.post<string[]>(url, {}).pipe(
      map((resp) => this.decodeArrayFromJwt<Provincia>(resp[0])),
      catchError((err) => {
        console.error('Error getProvincias', err);
        return throwError(() => err);
      })
    );
  }

  /** Distritos por departamento + provincia */
  getDistritos(coddpto: string, codprov: string): Observable<Distrito[]> {
    const url = `${this.baseUrl}/api/distrito/${coddpto}/${codprov}`;
    return this.http.post<string[]>(url, {}).pipe(
      map((resp) => this.decodeArrayFromJwt<Distrito>(resp[0])),
      catchError((err) => {
        console.error('Error getDistritos', err);
        return throwError(() => err);
      })
    );
  }

  /** Niveles por modalidad */
  getNiveles(modalidad: string): Observable<Nivel[]> {
    const url = `${this.baseUrl}/BuscaNivel?modalidad=${modalidad}`;
    return this.http.post<string[]>(url, {}).pipe(
      map((resp) => this.decodeArrayFromJwt<Nivel>(resp[0])),
      catchError((err) => {
        console.error('Error getNiveles', err);
        return throwError(() => err);
      })
    );
  }

  /** Búsqueda de colegios (a través de tu proxy) */
  /** Búsqueda de colegios (a través de tu proxy) */
  buscarColegios(params: {
    coddpto: string;
    codprov: string;
    coddist: string;
    modalidad?: string;
    nivel?: string;
    page?: number;
    pageSize?: number;
    texto?: string;          // 👈 nuevo
    lat?: number;
    lng?: number;
    ubicacionTexto?: string; // 👈 nuevo
  }): Observable<SchoolSearchResult> {
    return this.http.post<SchoolSearchResult>(`${this.baseUrl}/colegios`, params);
  }

}
