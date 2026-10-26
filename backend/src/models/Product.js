import mongoose from 'mongoose';
const schema=new mongoose.Schema({sellerId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},title:{type:String,required:true,trim:true,maxlength:100},description:{type:String,required:true,maxlength:1500},category:{type:String,required:true},condition:{type:String,enum:['New','Like New','Good','Fair'],required:true},pricePaise:{type:Number,required:true,min:100},originalPaise:{type:Number,min:0},college:{type:String,required:true},status:{type:String,enum:['available','reserved','sold','hidden'],default:'available',index:true},images:{type:[String],default:[]}},{timestamps:true});
schema.index({title:'text',description:'text'});
export default mongoose.model('Product',schema);
