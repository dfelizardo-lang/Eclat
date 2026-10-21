const {test}=require('../support/site');
const {checkResponsive}=require('../support/responsive');
test('Pages essentielles accessibles dans le profil émulé',async({page},info)=>checkResponsive(page,info));
