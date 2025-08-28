import { WebContainer } from '@webcontainer/api';

let webcontainerInstance = null



 const getWebContainer = async () => {

   if(webcontainerInstance == null){

    webcontainerInstance = await WebContainer.boot()
   }
  
   return webcontainerInstance;


 }


 export default getWebContainer