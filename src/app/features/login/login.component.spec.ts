import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let httpMock: HttpTestingController;
  let router: Router;

  function montar(): void {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('entra e vai para os pedidos', async () => {
    montar();
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    component.identificador = 'joao';
    component.senha = 'secreta123';

    const promessa = component.entrar();

    const requisicao = httpMock.expectOne(`${environment.urlDaApi}/api/autenticacao/entrar`);
    expect(requisicao.request.body).toEqual({ email: 'joao', senha: 'secreta123' });
    requisicao.flush({
      tokenAcesso: 'a',
      tokenRefresh: 'r',
      usuario: { id: 9, nome: 'João', email: null, papel: 'Entregador' }
    });
    await promessa;

    expect(router.navigate).toHaveBeenCalledWith(['/pedidos']);
  });

  it('mostra erro com credencial invalida', async () => {
    montar();
    component.identificador = 'joao';
    component.senha = 'errada';

    const promessa = component.entrar();

    httpMock.expectOne(`${environment.urlDaApi}/api/autenticacao/entrar`).flush(
      { message: 'Usuário ou senha inválidos.' },
      { status: 401, statusText: 'Unauthorized' }
    );
    await promessa;

    expect(component.erro()).toContain('inválidos');
  });

  it('recusa papel que nao entrega', async () => {
    montar();
    component.identificador = 'ana@exemplo.com';
    component.senha = 'secreta123';

    const promessa = component.entrar();

    httpMock.expectOne(`${environment.urlDaApi}/api/autenticacao/entrar`).flush({
      tokenAcesso: 'a',
      tokenRefresh: 'r',
      usuario: { id: 1, nome: 'Ana', email: 'ana@exemplo.com', papel: 'Cliente' }
    });
    await promessa;

    expect(component.erro()).toContain('entregadores');
  });
});
