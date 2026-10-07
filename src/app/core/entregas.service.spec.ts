import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { EntregasService } from './entregas.service';

describe('EntregasService', () => {
  let service: EntregasService;
  let httpMock: HttpTestingController;

  const base = `${environment.urlDaApi}/api/entregas/pedidos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(EntregasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista despachados com GET e filtros na query', () => {
    service.listar({ statusEntrega: 'Despachado' }).subscribe();

    const requisicao = httpMock.expectOne(`${base}?statusEntrega=Despachado`);
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush([]);
  });

  it('lista entregues com periodo', () => {
    service.listar({ statusEntrega: 'Entregue', de: '2026-10-01', ate: '2026-10-31' }).subscribe();

    const requisicao = httpMock.expectOne(
      `${base}?statusEntrega=Entregue&de=2026-10-01&ate=2026-10-31`
    );
    requisicao.flush([]);
  });

  it('marca entregue com POST, e nao com PUT', () => {
    service.marcarEntregue(7).subscribe();

    const requisicao = httpMock.expectOne(`${base}/7/entregar`);
    expect(requisicao.request.method).toBe('POST');
    requisicao.flush({ id: 7 });
  });
});
