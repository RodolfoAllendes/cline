import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { InterfaceComponent } from './interface/interface.component';
import { CanvasComponent } from './canvas/canvas.component';

describe('AppComponent', () => {

  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule
      ],
      declarations: [
        AppComponent,
        InterfaceComponent,
        CanvasComponent
      ],
    }).compileComponents();
  }));

  beforeEach( ()=>{
    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
  });

  it('should create the app', async(() => {
    expect(app).toBeTruthy();
  }));

  // it('should propagate changeHighlight events to the Canvas Component', ()=>{
  //   spyOn(app.canvas, 'updateMatchHighlight');
  //   spyOn(app.canvas, 'drawScene');
  //   app.onChangeHighlightType();
  //   fixture.whenStable().then( ()=>{
  //     expect(app.canvas.updateMatchHighlight).toHaveBeenCalled();
  //     expect(app.canvas.drawScene).toHaveBeenCalled();
  //   });
  // });

});
