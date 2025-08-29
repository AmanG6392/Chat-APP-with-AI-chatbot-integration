import React, { useState, useEffect, useContext, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "../config/axios.js";
import {
  initializeSocket,
  receiveMessage,
  sendMessage
} from "../config/socket";
import { useUser } from "../context/User.context.jsx";
import Markdown from "markdown-to-jsx";
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

import getWebContainer from "../config/webContainer.js";
import FileTreeNode from "../components/FileTreeNode.jsx";

const Project = () => {
  const location = useLocation();
  const { user } = useUser();

  // UI states
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [project, setProject] = useState(location.state.project);
  const [message, setmessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messageBox = useRef();
  const [users, setUsers] = useState([]);

  // File tree states
  const [flatFileTree, setFlatFileTree] = useState({});   // for DB + WebContainer
  const [nestedFileTree, setNestedFileTree] = useState({}); // for UI explorer
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);

  // WebContainer states
  const [webContainer, setWebContainer ] = useState(null);
  const [iframeUrl,setIframeUrl] = useState(null);
  const [runProcess,setRunProcess] = useState(null);

  // ---------- Helpers ----------
  function getLanguageFromExtension(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    const map = { js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", py: "python", java: "java", c: "c", cpp: "cpp", cs: "csharp", css: "css", html: "xml", json: "json", md: "markdown", sh: "bash", go: "go", php: "php", rb: "ruby", swift: "swift", kt: "kotlin", rs: "rust", };
    return map[ext] || null;
  }

  function buildNestedTree(flatTree) {
    const nested = {};
    Object.entries(flatTree).forEach(([path, value]) => {
      const parts = path.split("/");
      let current = nested;
      parts.forEach((part, idx) => {
        if (!current[part]) {
          current[part] = idx === parts.length - 1 ? value : { folder: true, children: {} };
        }
        if (current[part].children) {
          current = current[part].children;
        }
      });
    });
    return nested;
  }

  function SyntaxHighlightedCode({ className, children }) {
    const ref = useRef(null);
    useEffect(() => {
      if (ref.current) {
        let result;
        try {
          if (className?.startsWith("lang-")) {
            const lang = className.replace("lang-", "");
            result = hljs.highlight(children, { language: lang });
          } else {
            result = hljs.highlightAuto(children);
          }
          ref.current.innerHTML = result.value;
        } catch {
          ref.current.textContent = children;
        }
      }
    }, [className, children]);
    return <code ref={ref} className={className} />;
  }

  function WriteAiMessage(message) {
    const messageObject = JSON.parse(message)
    return (
      <div className='overflow-auto bg-slate-950 text-white rounded-sm p-2'>
        <Markdown
          children={messageObject.text}
          options={{ overrides: { code: SyntaxHighlightedCode } }}
        />
      </div>
    )
  }

  function saveFileTree(ft){
    axios.put('/projects/update-file-tree',{
      projectId: project._id,
      fileTree: ft   // always flat
    }).then(res => console.log(res.data))
      .catch(err => console.log(err))
  }

  // ---------- Effects ----------
  useEffect(() => {
    if (project?._id) {
      initializeSocket(project._id);
    }

    if(!webContainer){
      getWebContainer().then(container => setWebContainer(container))
    }

    receiveMessage("project-message", (data) => {
      const message = JSON.parse(data.message);
      if (message.fileTree) {
        setFlatFileTree(message.fileTree);
        setNestedFileTree(buildNestedTree(message.fileTree));

        if (webContainer){
          webContainer.mount(message.fileTree).then(() => console.log("Mounted"));
        }
      }
      setMessages((prev) => [...prev, data]);
    });

    axios.get(`/projects/getprojectId/${location.state.project._id}`)
      .then((res) => {
        setProject(res.data.project);
        setFlatFileTree(res.data.project.fileTree);
        setNestedFileTree(buildNestedTree(res.data.project.fileTree));
        setCurrentFile(Object.keys(res.data.project.fileTree)[0] || null);
      });

    axios.get("/users/allUsers")
      .then((res) => setUsers(res.data.users))
      .catch((err) => console.log(err));
  }, []);

  // ---------- Handlers ----------
  const send = () => {
    if (message === "") return;
    sendMessage("project-message", { message, sender: user });
    setMessages((prev) => [...prev, { sender: user, message }]);
    setmessage("");
  };

  const handleUserClick = (_id) => {
    setSelectedUserId((prev) => {
      const updated = new Set(prev);
      updated.has(_id) ? updated.delete(_id) : updated.add(_id);
      return updated;
    });
  };

  // ---------- UI ----------
  return (
    <main className="h-screen w-screen flex bg-slate-300">
      {/* Explorer */}
      <section className="left flex flex-col h-screen min-w-92 relative">
        {/* Chat + Collaborators */}
        {/* ... unchanged from your version ... */}
      </section>

      {/* Code editor */}
      <section className="right bg-red-50 flex-grow h-full text-black flex">
        <div className="explorer h-full max-w-64 min-w-52 bg-slate-200 overflow-auto">
          <div className="file-tree w-full mt-0 p-2">
            {Object.entries(nestedFileTree).map(([name, node]) => (
              <FileTreeNode
                key={name}
                name={name}
                node={node}
                fullPath={name}
                setCurrentFile={setCurrentFile}
                setOpenFiles={setOpenFiles}
              />
            ))}
          </div>
        </div>

        <div className="code-editor flex flex-col flex-grow h-full">
          <div className="top flex justify-between w-full">
            <div className="files flex">
              {openFiles.map((file,index)=> (
                <button key={index} onClick={() => setCurrentFile(file)}
                  className={`tree-element p-2 px-4 ${currentFile=== file ? 'bg-slate-400':'bg-slate-300'}`}>
                  <p className='font-semibold text-lg'>{file}</p>
                </button>
              ))}
            </div>

            <div className="actions flex gap-2">
              <button onClick={async () => {
                await webContainer.mount(flatFileTree);
                const installProcess = await webContainer.spawn("npm", [ "install" ]);
                installProcess.output.pipeTo(new WritableStream({ write(chunk){ console.log(chunk) } }))
                if (runProcess) runProcess.kill();
                let tempRunProcess = await webContainer.spawn("npm", [ "start" ]);
                tempRunProcess.output.pipeTo(new WritableStream({ write(chunk){ console.log(chunk) } }))
                setRunProcess(tempRunProcess);
                webContainer.on('server-ready', (port, url) => setIframeUrl(url));
              }} className="p-2 px-4 bg-slate-500 text-white">run</button>
            </div>
          </div>

          <div className="bottom flex flex-grow overflow-auto">
            {currentFile && flatFileTree[currentFile] && (
              <div className="code-editor-area h-full flex-grow bg-slate-50">
                <pre className="hljs h-full bg-blue-950 text-white rounded-lg p-4 overflow-auto">
                  <code className="hljs h-full outline-none" contentEditable suppressContentEditableWarning
                    onBlur={async (e) => {
                      const updatedContent = e.target.innerText;
                      const updatedFlat = {
                        ...flatFileTree,
                        [currentFile]: { file: { contents: updatedContent } }
                      };
                      setFlatFileTree(updatedFlat);
                      setNestedFileTree(buildNestedTree(updatedFlat));
                      saveFileTree(updatedFlat);
                      if (webContainer) await webContainer.fs.writeFile(currentFile, updatedContent);
                    }}
                    dangerouslySetInnerHTML={{
                      __html: (() => {
                        const code = flatFileTree[currentFile].file.contents;
                        const lang = getLanguageFromExtension(currentFile);
                        try {
                          return lang ? hljs.highlight(code, { language: lang }).value : hljs.highlightAuto(code).value;
                        } catch { return code; }
                      })()
                    }}
                  />
                </pre>
              </div>
            )}
          </div>
        </div>

        {iframeUrl && (
          <div className="flex min-w-96 flex-col h-full">
            <div className="address-bar">
              <input type="text" className="w-full p-2 px-4 bg-slate-200" value={iframeUrl} readOnly />
            </div>
            <iframe src={iframeUrl} className="w-full h-full"></iframe>
          </div>
        )}
      </section>
    </main>
  );
};

export default Project;
