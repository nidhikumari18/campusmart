import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {initialProducts} from '../data/products';
export const useShop=create(persist((set,get)=>({
 products:initialProducts,wishlist:[],cart:[],orders:[],theme:'light',user:null,
 toggleTheme:()=>set(s=>({theme:s.theme==='light'?'dark':'light'})),
 toggleWishlist:(id)=>set(s=>({wishlist:s.wishlist.includes(id)?s.wishlist.filter(x=>x!==id):[...s.wishlist,id]})),
 addCart:(id)=>set(s=>({cart:s.cart.includes(id)?s.cart:[...s.cart,id]})),
 removeCart:(id)=>set(s=>({cart:s.cart.filter(x=>x!==id)})),
 addProduct:(product)=>set(s=>({products:[{...product,id:crypto.randomUUID(),seller:s.user?.name||'You',college:s.user?.college||'My College',color:'#E9DDFC',emoji:'📦',original:Number(product.original||product.price),price:Number(product.price)},...s.products]})),
 login:(user)=>set({user}),logout:()=>set({user:null}),
 demoCheckout:()=>{const s=get();const items=s.cart.map(id=>s.products.find(p=>p.id===id)).filter(Boolean);if(!items.length)return;set({orders:[{id:crypto.randomUUID(),items,total:items.reduce((n,p)=>n+p.price,0),date:new Date().toISOString(),status:'Demo order — unpaid'},...s.orders],cart:[]});}
}),{name:'campusmart-demo-v1'}));
