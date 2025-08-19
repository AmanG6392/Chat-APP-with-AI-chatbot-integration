import React, { useState, useEffect, useContext, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "../config/axios.js";
import {
  initializeSocket,
  receiveMessage,
  sendMessage
} from "../config/socket";
import { UserProvider, useUser } from "../context/User.context.jsx";
import Markdown from "markdown-to-jsx";

const Project = () => {
  const location = useLocation();

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [project, setProject] = useState(location.state.project);
  const [message, setmessage] = useState("");
  const [messages, setMessages] = useState([]);
  const { user } = useUser();
  const messageBox = React.createRef();
  const [users, setUsers] = useState([]);

  function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)

            // hljs won't reprocess the element unless this attribute is removed
            ref.current.removeAttribute('data-highlighted')
        }
    }, [ props.className, props.children ])

    return <code {...props} ref={ref} />
  }

  function WriteAiMessage(message) {
        
    const data = message
        return (
            <div
                className='overflow-auto bg-slate-950 text-white rounded-sm p-2'
            >
                <Markdown
                    children={message}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>)
  }


  const handleUserClick = (_id) => {
    setSelectedUserId((prev) => {
      const updated = new Set(prev);
      if (updated.has(_id)) {
        updated.delete(_id);
      } else {
        updated.add(_id);
      }
      return updated;
    });
  };

  function addCollaborator() {
    axios
      .put("/projects/add-user", {
        // using to send the required data....

        projectId: location.state.project._id,

        users: Array.from(selectedUserId),
      })
      .then((res) => {
        console.log(res.data);
        setIsModalOpen(false);
      })
      .catch((err) => {
        console.log(err.response.data);
      });
  }

  useEffect(() => {
    if (project?._id) {
      initializeSocket(project._id);
    }

    receiveMessage("project-message", (data) => {

      setMessages((prevMessages) => [...prevMessages, data]);

    });

    axios
      .get(`/projects/getprojectId/${location.state.project._id}`)
      .then((res) => {
        setProject(res.data.project);
      });

    axios
      .get("/users/allUsers")
      .then((res) => {
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const send = () => {
    if (message === "") return;

    sendMessage("project-message", {
       message,
      sender: user,
    });

    setMessages((prevMessages) => [...prevMessages, { sender: user, message }]); // Update messages state

    setmessage("");
  };

  function scrollToBottom() {
    if (messageBox.current) {
      messageBox.current.scrollTop = messageBox.current.scrollHeight;
    }
  }

  return (
    <main className="h-screen w-screen flex">
      <section className="left  flex flex-col h-screen min-w-92 relative  ">
        <header className=" flex justify-between items-center  p-4 w-full bg-slate-800 ">
          <button className="flex gap-2" onClick={() => setIsModalOpen(true)}>
            <i className="ri-add-fill"></i>
            <p>Add Collaborators</p>
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              setIsSidePanelOpen(!isSidePanelOpen);
            }}
            className="p-1"
          >
            <i
              className="ri-group-fill"
              style={{ fontSize: "22px", color: "grey-800" }}
            ></i>
          </button>
        </header>

        <div className="conversation-area w-full pt-1 pb-14 flex flex-grow flex-col bg-slate-400 gap-1 overflow-y-auto relative">
          <div
            ref={messageBox}
            className="message-box p-2 flex flex-col gap-1 flex-grow bg-slate-400 overflow-y-auto"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex 
                 ${msg.sender.email === user.email 
                 ? "ml-auto bg-gray-200 text-black"   // Your messages → right
                 : "mr-auto bg-gray-200 text-black"}   // Others → left
                 message flex-col p-2 w-fit rounded-md max-w-80`}
              >
                <small className="opacity-65 text-xs text-black">
                  {msg.sender.email === user.email ? "You" : msg.sender.email}
                </small>

                  {msg.sender._id === "ai" ? 
                    WriteAiMessage(msg.message)
                   :                   
                    msg.message                      
                  }
                

              </div>
            ))}
          </div>

          <div className=" fixed bottom-0 flex w-93  absolute bottom-0 left-0  p-3">
            <input
              value={message}
              onChange={(e) => setmessage(e.target.value)}
              type="text"
              placeholder="Enter message"
              className="flex-grow bg-white p-2 px-4 rounded-full border-none outline-none text-black"
            />

            <button className="ml-1 " onClick={send}>
              <i
                className="ri-send-plane-fill"
                style={{ fontSize: "30px", color: "white" }}
              ></i>
            </button>
          </div>
        </div>

        <div
          className={`sidePanel w-2/3 h-full flex flex-col gap-2 bg-slate-50 absolute transition-all ${
            isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
          } top-0`}
        >
          <header className="flex items-center justify-between p-2 px-3 bg-slate-700">
            <h1 className="semi-bold flex justify-start ">Collaborators</h1>

            <button
              onClick={(e) => {
                e.preventDefault();
                setIsSidePanelOpen(!isSidePanelOpen);
              }}
            >
              <i
                className="ri-close-fill flex justify-end"
                style={{ fontSize: "22px", color: "grey-800" }}
              ></i>
            </button>
          </header>

          <div className="users flex flex-col gap-2">
            {project.users &&
              project.users.map((user, index) => {
                return (
                  <div
                    key={index}
                    className="user cursor-pointer hover:bg-slate-300 flex gap-2 items-center text-black"
                  >
                    <div className="w-13 h-13 rounded-full bg-slate-500 flex items-center justify-center">
                      <i
                        className="ri-user-fill"
                        style={{ fontSize: "22px" }}
                      ></i>
                    </div>

                    <h1 className="text-md font-semibold text-black">
                      {user.email}
                    </h1>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed flex inset-0 bg-red bg-opacity-50 items-center justify-center rounded-md">
          <div className="bg-white rounded-md w-96 max-w-full relative text-black flex flex-col m-0">
            <header className="flex w-full top-0 justify-between items-center bg-slate-700 m-0 p-4">
              <h2 className="text-xl font-semibold">Select User</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2">
                <i className="ri-close-fill" style={{ fontSize: "22px" }}></i>
              </button>
            </header>

            <div className="users-list flex flex-col gap-2 mb-16 max-h-80 overflow-auto ">
              {users.map((user) => (
                <div
                  key={user._id}
                  className={`user cursor-pointer bg-slate-200 hover:bg-slate-500 ${
                    selectedUserId.has(user._id) ? "bg-slate-400" : ""
                  } p-2 flex gap-2 items-center`}
                  onClick={() => handleUserClick(user._id)}
                >
                  <div className="aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600">
                    <i className="ri-user-fill absolute"></i>
                  </div>

                  <h1 className="font-semibold text-lg">{user.email}</h1>
                </div>
              ))}
            </div>

            <button
              onClick={addCollaborator}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Add Collaborators
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;
