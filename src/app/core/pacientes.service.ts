import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CrearPacienteRequest, Paciente, PacienteItem } from './models/clinica.models';

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  search(term: string) {
    return this.http.get<PacienteItem[]>(`${this.base}/pacientes/search`, { params: { term } });
  }

  create(req: CrearPacienteRequest) {
    return this.http.post<PacienteItem>(`${this.base}/pacientes`, req);
  }

  getById(id: string) {
    return this.http.get<Paciente>(`${this.base}/pacientes/${id}`);
  }
}
