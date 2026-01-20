import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NegozioProdottiComponent } from './negozio-prodotti';


describe('NegozioProdotti', () => {
  let component: NegozioProdottiComponent;
  let fixture: ComponentFixture<NegozioProdottiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NegozioProdottiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NegozioProdottiComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
