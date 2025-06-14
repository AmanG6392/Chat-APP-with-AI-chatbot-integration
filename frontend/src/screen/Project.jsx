import React,{useState, useEffect} from 'react'
import { useLocation } from 'react-router-dom'
import axios from '../config/axios.js'

const Project = () => {

  const Location = useLocation()
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(new Set())


  const [users, setUsers] = useState([])

  const handleUserClick = (_id) => {

    setSelectedUserId(prev => {
    const updated = new Set(prev);
    if (updated.has(_id)) {
      updated.delete(_id);
    } else {
      updated.add(_id);
    }
    console.log();
    
    return updated;
    });

  };

   
  useEffect(()=>{
   
   axios.get('users/allUsers')
   .then(res=>{ 
    setUsers(res.data.users)
  })
   .catch((err)=>{

    console.log(err);

   })

  },[])
  

  return (

    <main  className='h-screen w-screen flex'>

        <section className='left  flex flex-col h-full min-w-92 relative  '>
        
          <header
           className=" flex justify-between items-center  p-4 w-full bg-slate-800">
            
            <button className='flex gap-2'
             onClick={()=> setIsModalOpen(true)}>
              <i className="ri-add-fill"></i>
              <p>Add Collaborators</p>
            </button>

            <button 

              onClick={(e) =>{
              
                e.preventDefault()
                setIsSidePanelOpen(!isSidePanelOpen)}
              }

               className= 'p-1'>

               <i className="ri-group-fill" style={{ fontSize: '22px', color: 'grey-800'  }}></i>
            </button>

          </header>

          <div className="conversation-area w-full flex flex-grow flex-col bg-slate-400 gap-2">
            
            <div className="message-box  p-1 max-w-56 flex flex-col p-2 bg-slate-50 w-fit rounded-md">
                 <div className="incoming-message text-black">
                  <small 
                  className='opacity-65 text-xs'>example@jndjcnjank</small>
                  <p>lorem ipsumnjnjnej jejnkrj den </p>
                 </div>

            </div>

            <div className=" ml-auto message-box p-1 max-w-56 flex flex-col p-2 bg-slate-50 w-fit rounded-md">
                 <div className="incoming-message text-black">
                  <small 
                  className='opacity-65 text-xs'>example@jndjcnjank</small>
                  <p>lorem ipsumnjnjnej jejnkrj den hajn jnsjanjnwanj jndsjanjjknjndms jnksmnamd xmanjjjn mnirnlkm kwjerwhqhnfnr fa fcarjac;oknfgeret glwekerw3qareafa flsaredaasmrkema kmaasdeeqqerr tttgkm, aswqfkawefmmcaknf cmnka </p>
                 </div>

            </div>


            <div className="fixed bottom-0 left-0 w-80  p-3">
               
              <div className="flex w-full">
                   
                <input type="text"
                 placeholder="Enter message"
                 className="flex-grow bg-white p-2 px-4 rounded-full border-none outline-none text-black"
                />
                   
                <button className="ml-1">
                    <i className="ri-send-plane-fill" style={{ fontSize: '25px', color: 'white' }}></i>
                </button>

              </div>

            </div>

          </div>


           <div className={`sidePanel w-2/3 h-full flex flex-col gap-2 bg-slate-50 absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0`}>
           
              <header className='flex justify-end p-2 px-3 bg-slate-700'>
               
                <button 

                   onClick={(e) =>{
              
                    e.preventDefault()
                   setIsSidePanelOpen(!isSidePanelOpen)}}>

                  <i className='ri-close-fill' style={{ fontSize: '22px', color: 'grey-800',  }}></i>

                </button>
              </header>

              <div className="users flex flex-col gap-2">
               
                <div className="user cursor-pointer hover:bg-slate-300 flex gap-2 items-center text-black ">
               
                   <div className="w-13 h-13 rounded-full bg-slate-500 flex items-center  justify-center ">
                      <i className='ri-user-fill' style={{fontSize:'22px'}}></i>
                   </div>

                   <h1 className='text-md font-semibold'>username</h1>

                </div>

              </div>
           
           
           
           </div>

        </section>

        {isModalOpen && (
          <div className="fixed flex inset-0 bg-red bg-opacity-50 items-center justify-center rounded-md">
                    <div className="bg-white rounded-md w-96 max-w-full relative text-black flex flex-col m-0">

                        <header className='flex w-full top-0 justify-between items-center bg-slate-700 m-0 p-4'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2'>
                                <i className="ri-close-fill" style={{fontSize:'22px'}}></i>
                            </button>
                        </header>

                        <div className="users-list flex flex-col gap-2 mb-16 max-h-80 overflow-auto ">

                            {users.map(user =>
                            
                             (
                              
                                <div 

                                  key={user._id} 
                                  className={`user cursor-pointer bg-slate-200 hover:bg-slate-500 ${ selectedUserId.has(user._id) ? 'bg-slate-400' : '' } p-2 flex gap-2 items-center`}
                                  onClick={() => handleUserClick(user._id)}>
                                
                                  <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                    <i className="ri-user-fill absolute"></i>
                                  </div>

                                  <h1 className='font-semibold text-lg'>{user.email}</h1>

                                </div>


                              )
                              

                             )

                            }

                        </div>
                        
                        <button className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md'>
                            Add Collaborators
                        </button>
                        
                    </div>
          </div>
         )
        }



    </main>
  )
}

export default Project