const {PrismaClient}=require('../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client');
const p=new PrismaClient();
p.order.findFirst({select:{id:true,orderNumber:true,subtotal:true,total:true}}).then(o=>{
  console.log(JSON.stringify(o));
  p.$disconnect();
});
