import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DettaglioProdottoComponent } from './dettaglio-prodotto';


describe('DettaglioProdotto', () => {
  let component: DettaglioProdottoComponent;
  let fixture: ComponentFixture<DettaglioProdottoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DettaglioProdottoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DettaglioProdottoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
