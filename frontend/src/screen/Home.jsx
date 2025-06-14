import React, { useState ,useEffect} from 'react'
import { useUser } from '../context/User.context.jsx'
import axios from '../config/axios.js'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const { user } = useUser()
  const [ project, setProject] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [projectName, setProjectName] = useState(null)

  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(projectName);

    axios.post('/projects/create',{name: projectName}).then((res)=>{
  
    setShowModal(false)
    setProjectName('')

    }).catch((err) => {
      console.log(err);
      
    })
    
    // Handle project name submission logic here
    
  }


  useEffect( () => {
    axios.post('/projects/my-projects').then((res)=>{
      console.log(res.data);

      setProject(res.data.projects)
      
    }).catch((error)=>{
      console.log(error.message);
      
    })
  },[])


  return (
    <main className='p-4'>
      <div className="projects flex flex-wrap gap-3 ">
        <button
          className="project p-4 h-12 w-40 border rounded-md border-slate-300 flex items-center justify-center"
          onClick={() => setShowModal(true)}
        >
          <div className="flex ">New project</div>
          <i className="ri-link ml-2" style={{ fontSize: '25px', color: 'white' }}></i> 
          
        </button>

          {
               project.map((project) => (
                        <div key={project._id}

                            onClick={() => {
                                navigate(`/project`, {
                                    state: { project }
                                })
                            }}
                            className="project flex flex-col gap-2 cursor-pointer p-4 border border-slate-300 rounded-md min-w-52 hover:bg-slate-500">
                            <h2
                                className='font-semibold'
                                >{project.name}
                                </h2>

                            <div className="flex gap-2">
                                <p> <small> <i className="ri-user-line"></i> Collaborators</small> :</p>
                                {project.users.length}
                            </div>

                        </div>
                    ))      
                
            }
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm ">
            <h2  id="modal-title"  className="text-lg mb-4 text-black bold text-xl font-bold">Create New Project</h2>
            <form onSubmit={handleSubmit}>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Project Name
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </label>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-400 rounded hover:bg-gray-300"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-200"
                >
                  Create
                </button>
                
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default Home