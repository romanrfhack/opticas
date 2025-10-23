
// src/app/core/productos.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
//import { ArmazonesDto, PagedResult, ProductDto } from './models/clinica.models';
import { ChangeVisitaStatusRequest, PagedResultCE, VisitaCostoRow } from '../features/ordenes/ordenes.models';

@Injectable({ providedIn: 'root' })
export class VisitasCostosService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

//   getArmazones(q?: string) { 
//     const params: any = {};
//     if (q) params.q = q;
//     return this.http.get<ArmazonesDto[]>(`${this.base}/products/armazones`, { params }); 
//   }

  list(params: { page?: number; pageSize?: number; search?: string; estado?: string }) {
    const httpParams = new HttpParams({ fromObject: {
      page: params.page?.toString() ?? '1',
      pageSize: params.pageSize?.toString() ?? '20',
      ...(params.search ? { search: params.search } : {}),
      ...(params.estado ? { estado: params.estado } : {}),
    }});
    return this.http.get<PagedResultCE<VisitaCostoRow>>(this.base + '/historias/visitas-costos', { params: httpParams });
  }

//   const changeStatus = async (visitaId: string, nextStatus: EstadoHistoria) => {
//     const response = await fetch(`/api/visitas/${visitaId}/status`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//             toStatus: nextStatus, // ← Número, no string
//             observaciones: '...',
//             // ... otros campos
//         })
//     });
// };

//  public sealed record ChangeVisitaStatusRequest(
//      int ToStatus,
//      string? Observaciones,
//      string? LabTipo,             // "Interno" | "Externo" (solo si ToStatus = Enviada a laboratorio)
//      Guid? LabId,
//      string? LabNombre
//  );



  changeStatus(visitaId: string, nextStatus: ChangeVisitaStatusRequest) {
    return this.http.post(`${this.base}/historias/${visitaId}/status`, nextStatus);
  }

}



