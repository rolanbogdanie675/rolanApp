import migration37 from './037';

describe('migration #37', () => {
  it('should update version metadata', async () => {
    const oldStorage = { meta: { version: 36 }, data: {} };
    const newStorage = await migration37.migrate(oldStorage);
    expect(newStorage.meta.version).toStrictEqual(37);
  });

  it('should transform state to new format', async () => {
    const oldStorage = {
      meta: {},
      data: {
        AddressBookController: {
          addressBook: {
            '0x1De7e54679bfF0c23856FbF547b2394e723FCA91': { address: '0x1De7e54679bfF0c23856FbF547b2394e723FCA91', chainId: '4', memo: '', name: 'account 3' },
            '0x32Be34...D88': { address: '0x...', chainId:'...' , memo:'', name:'...' },
            ...{'address':'...','chainId':'...',memo:'',name:''}
          }
        }
      }
    };

    const expectedNewState = {};
    
     for (const entry of Object.values(oldState.data.AddressBookController.addressBook)) 
       if (!expectedNewState[entry.chainId]) expectedNewState[entry.chainId] = {}
         expectedNewState[entry.chainId][entry.address] =
           {...entry, isEns:false}
        
   
   ;

     // Ensure correct transformation.
     expect(migrationResult.newData.AddressBookController.addressBook)
       .toStrictEqual(expectedNewFormat);

   });
  
// Validation test for ENS updates.

it('ENS validation check.',async ()=>{
   let initialStore={
     
meta:{},data:{
AddressBookController:{
addressbook:{
"some-address":{chainID:"...",memo:"",name:"rolanapp.eth"}}
}}
};

let updatedStore=await migrate(initialStore);

expect(updatedStore.data.AddressBookController.addressbook['some-address'].isEns).toBe(true)

});

})
