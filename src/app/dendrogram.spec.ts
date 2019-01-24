import { Dendrogram } from './dendrogram';

describe('Dendrogram', ()=> {

  let dendro: Dendrogram;

  beforeEach(()=>{
    dendro = new Dendrogram();
  });

  afterEach(()=>{
    dendro = null;
  });

  it('should return the string Undefined when a new Dendrogram is created without parameters',()=>{

    dendro = new Dendrogram();
    expect(dendro.getTitle()).toEqual("Undefined");

  });

});
