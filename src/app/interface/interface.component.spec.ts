import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentFixtureAutoDetect } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { InterfaceComponent } from './interface.component';

describe('InterfaceComponent', () => {
  let fixture: ComponentFixture<InterfaceComponent>;
  let component:   InterfaceComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports:[
        FormsModule
      ],
      declarations: [
        InterfaceComponent
      ],
      providers: [
        { provide: ComponentFixtureAutoDetect, useValue: true}
      ]
    }).compileComponents();
  }));

  beforeEach( ()=>{
    fixture = TestBed.createComponent(InterfaceComponent);
    component = fixture.componentInstance;
  });

  it('should create the Interface Component', () => {
    expect(component).toBeTruthy();
  });

  it('should request the Application to change highlight type', ()=>{
    const input = fixture.nativeElement.querySelector('#highlightTypeSelect');
    spyOn(component.changeHighlightTypeEmitter, 'emit');

    input.selectedIndex = 1;
    input.dispatchEvent(new Event('change'));
    fixture.whenStable().then( ()=>{
      expect(component.changeHighlightTypeEmitter.emit).toHaveBeenCalledWith("diff");
    });
  });

  it('should request the Application to change the type of cluster matching strategy', ()=>{
    const input = fixture.nativeElement.querySelector('#matchTypeSelect');
    spyOn(component.changeMatchTypeEmitter, 'emit');

    input.selectedIndex = 0;
    input.dispatchEvent(new Event('change'));
    fixture.whenStable().then( ()=>{
      expect(component.changeMatchTypeEmitter.emit).toHaveBeenCalledWith(1);
      expect(input[0].label).toBe("ISOMORPHIC");
    });
  });

  it('should request the Application to change the sample size for trivial clusters', ()=>{
    const input = fixture.nativeElement.querySelector('#sampleSizeInput');
    spyOn(component.changeSampleSizeEmitter, 'emit');

    input.value = 5;
    input.dispatchEvent(new Event('change'));
    fixture.whenStable().then( ()=>{
      expect(component.changeSampleSizeEmitter.emit).toHaveBeenCalledWith(Number(5));
    });
  });

  it('should request the Application to horizontally flip a specific Dendrogram', ()=>{
    const input = fixture.nativeElement.querySelector('#flipDendrogramSelect');
    const opt = document.createElement("option");
    opt.value="1";
    opt.text="test";
    input.add(opt);
    input.selectedIndex = 1;
    spyOn(component.flipDendrogramEmitter, 'emit');
    input.dispatchEvent(new Event('change'));
    fixture.whenStable().then( ()=>{
      expect(component.flipDendrogramEmitter.emit).toHaveBeenCalledWith(0);
    });
  });

  it('should request the Application to load a new Dendrogram', ()=>{
    const mockFile = new File([''], 'filename', {type: 'text/plain'});
    const mockEvent = { target: { files: [mockFile] } };
    spyOn(component.loadDendrogramEmitter, 'emit');

    component.loadDendrogram(mockEvent);
    fixture.whenStable().then( ()=>{
      expect(component.loadDendrogramEmitter.emit).toHaveBeenCalledWith(mockFile);
    });
  });

  it('should request the Application the removal of a Dendrogram', ()=> {
    const input = fixture.nativeElement.querySelector('#removeDendrogramSelect');
    const opt = document.createElement("option");
    opt.value="1";
    opt.text="test";
    input.add(opt);
    input.selectedIndex = 1;
    spyOn(component.removeDendrogramEmitter, 'emit');
    input.dispatchEvent(new Event('change'));
    fixture.whenStable().then( ()=>{
      expect(component.removeDendrogramEmitter.emit).toHaveBeenCalledWith(0);
    });
  });

});
