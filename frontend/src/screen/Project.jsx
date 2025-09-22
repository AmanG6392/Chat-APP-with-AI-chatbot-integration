import React, { useState, useEffect, useContext, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "../config/axios.js";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
} from "../config/socket";
import { UserProvider, useUser } from "../context/User.context.jsx";
import Markdown from "markdown-to-jsx";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import { PencilIcon  } from "lucide-react";

import getWebContainer from "../config/webContainer.js";
import FileTreeNode from "../components/FileTreeNode.jsx";
import EmojiPicker from "emoji-picker-react";
import "@vscode/codicons/dist/codicon.css";

const Project = () => {
  const location = useLocation();

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [project, setProject] = useState(location.state.project);
  const [message, setmessage] = useState("");
  const [messages, setMessages] = useState([]);
  const { user } = useUser();
  const messageBox = useRef(null);
  const [users, setUsers] = useState([]);
  const [fileTree, setFileTree] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [webContainer, setWebContainer] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [runProcess, setRunProcess] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isToolPanelOpen, setIsToolPanelOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState("pencil");
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [toolColor, setToolColor] = useState("#000000");
  const [toolWidth, setToolWidth] = useState(2);
 




  const textareaRef = useRef(null);
  const shapes = useRef([]);
  const canvasRef = useRef(null);

  function getLanguageFromExtension(filename) {
    const ext = filename.split(".").pop().toLowerCase();

    const map = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      java: "java",
      c: "c",
      cpp: "cpp",
      cs: "csharp",
      css: "css",
      html: "xml", // highlight.js uses "xml" for HTML
      json: "json",
      md: "markdown",
      sh: "bash",
      go: "go",
      php: "php",
      rb: "ruby",
      swift: "swift",
      kt: "kotlin",
      rs: "rust",
    };

    return map[ext] || null; // return null if unknown
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
            // Auto-detect language if no lang- class is provided
            result = hljs.highlightAuto(children);
          }
          ref.current.innerHTML = result.value;
        } catch (e) {
          // fallback: just render plain text
          ref.current.textContent = children;
        }
      }
    }, [className, children]);

    return <code ref={ref} className={className} />;
  }

  function buildNestedTree(flatTree) {
    const nested = {};

    Object.entries(flatTree).forEach(([path, value]) => {
      const parts = path.split("/");
      let current = nested;

      parts.forEach((part, idx) => {
        if (!current[part]) {
          current[part] =
            idx === parts.length - 1 ? value : { folder: true, children: {} };
        }
        if (current[part].children) {
          current = current[part].children;
        }
      });
    });

    return nested;
  }

  function WriteAiMessage(message) {
    let messageObject;

    try {
      messageObject = JSON.parse(message);
    } catch {
      messageObject = { text: message };
    }

    return (
      <div className="overflow-auto bg-slate-950 text-white rounded-sm p-2">
        <Markdown
          children={messageObject.text}
          options={{
            overrides: {
              code: SyntaxHighlightedCode,
            },
          }}
        />
      </div>
    );
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

    if (!webContainer) {
      getWebContainer().then((container) => {
        setWebContainer(container);

        console.log("conatiner started");
      });
    }

    receiveMessage("project-message", (data) => {
      let messageObj;

      try {
        messageObj = JSON.parse(data.message);
      } catch {
        messageObj = { text: data.message }; // fallback if not JSON
      }

      if (messageObj.fileTree) {
        const nestedTree = buildNestedTree(messageObj.fileTree);
        setFileTree(nestedTree);

        if (webContainer) {
          webContainer
            .mount(messageObj.fileTree)
            .then(() => console.log("Mounted"));
        }
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: data.sender || messageObj.sender || { email: "Unknown" },
          message:
            typeof data.message === "string"
              ? data.message
              : JSON.stringify(data.message),
        },
      ]);
    });

    axios
      .get(`/projects/getprojectId/${location.state.project._id}`)
      .then((res) => {
        setProject(res.data.project);
        setFileTree(res.data.project.fileTree || {});
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

  useEffect(() => {
    if (messageBox.current) {
      messageBox.current.scrollTop = messageBox.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // reset height
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let isDrawing = false;
  let startX = 0, startY = 0;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  console.log("Canvas ready!");

  

  const resizeCanvas = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    redraw(ctx, canvas);
  };
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const startDraw = (e) => {
  startX = e.offsetX;
  startY = e.offsetY;
  isDrawing = true;

  if (selectedTool === "pencil" || selectedTool === "eraser") {
    shapes.current.push({
      type: selectedTool,
      path: [{ x: startX, y: startY }],
      color: selectedTool === "eraser" ? "#fff" : toolColor,
      width: toolWidth
    });
  } 
  else if (selectedTool === "fill") {
    shapes.current.push({ type: "fill", color: toolColor });
    redraw(ctx, canvas);
  }
  else if (selectedTool === "text") {
    setTextInputVisible(true);
    setTextInputValue("");
    setTextPosition({ x: e.offsetX, y: e.offsetY });
  } 
  else {
    // rectangle, circle, line
    shapes.current.push({
      type: selectedTool,
      startX,
      startY,
      endX: startX,
      endY: startY,
      color: toolColor,
      width: toolWidth
    });
  }
};


  const draw = (e) => {
    if (!isDrawing) return;
    const x = e.offsetX;
    const y = e.offsetY;

    const current = shapes.current[shapes.current.length - 1];
    if (!current) return;

    if (current.type === "pencil") {
      current.path.push({ x, y });
    } else if (current.type === "eraser") {
      current.path.push({ x, y });
    } else if (["rectangle", "circle", "line"].includes(current.type)) {
      current.endX = x;
      current.endY = y;
    }

    redraw(ctx, canvas);
  };

  const stopDraw = () => { isDrawing = false; };

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDraw);
  canvas.addEventListener("mouseleave", stopDraw);

  return () => {
    canvas.removeEventListener("mousedown", startDraw);
    canvas.removeEventListener("mousemove", draw);
    canvas.removeEventListener("mouseup", stopDraw);
    canvas.removeEventListener("mouseleave", stopDraw);
    window.removeEventListener("resize", resizeCanvas);
  };
  }, [selectedTool]);

  const redraw = (ctx, canvas) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  shapes.current.forEach(shape => {
    ctx.strokeStyle = shape.color || "black";
    ctx.lineWidth = shape.width || 2;
    switch (shape.type) {
      case "rectangle":
        ctx.strokeRect(shape.startX, shape.startY, shape.endX-shape.startX, shape.endY-shape.startY);
        break;
      case "circle":
        const r = Math.sqrt((shape.endX-shape.startX)**2 + (shape.endY-shape.startY)**2);
        ctx.beginPath();
        ctx.arc(shape.startX, shape.startY, r, 0, Math.PI*2);
        ctx.stroke();
        break;
      case "line":
        ctx.beginPath();
        ctx.moveTo(shape.startX, shape.startY);
        ctx.lineTo(shape.endX, shape.endY);
        ctx.stroke();
        break;
      case "pencil":
      case "eraser":
        ctx.beginPath();
        ctx.moveTo(shape.path[0].x, shape.path[0].y);
        shape.path.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        break;
      case "text":
        ctx.fillStyle = shape.color || "black";
        ctx.font = shape.width + "px sans-serif";
        ctx.fillText(shape.text, shape.startX, shape.startY);
        break;
      case "paint":
        ctx.fillStyle = shape.color || "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        break;
      case "fill":
      ctx.fillStyle = shape.color || "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      break;
    }
  });
  };


  const send = () => {
    if (message === "") return;

    sendMessage("project-message", {
      message,
      sender: user,
    });

    setMessages((prevMessages) => [...prevMessages, { sender: user, message }]); // Update messages state

    setmessage("");
  };

  function saveFileTree(ft) {
    axios
      .put("/projects/update-file-tree", {
        projectId: project._id,
        fileTree: ft,
      })
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <main className="h-screen w-screen flex bg-slate-300">
      <section className="left  flex flex-col h-screen min-w-90  max-w-100 relative  ">
        <header className=" flex justify-between items-center  p-4 w-full bg-slate-600 ">
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
            {messages.map((msg, index) => {
              let parsed;
              try {
                parsed = JSON.parse(msg.message);
              } catch {}

              const isFile = parsed?.type === "file";

              return (
                <div
                  key={index}
                  className={`flex 
                ${msg.sender.email === user.email ? "ml-auto" : "mr-auto"}   
                message flex-col p-2 rounded-md max-w-[65%] bg-gray-200 text-black break-words whitespace-pre-wrap`}
                >
                  <small className="opacity-65 text-xs text-black">
                    {msg.sender.email === user.email ? "You" : msg.sender.email}
                  </small>

                  {isFile ? (
                    <div className="flex flex-col">
                      <a
                        href={parsed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="text-blue-600 underline"
                      >
                        📎 {parsed.name}
                      </a>

                      {parsed.mime.startsWith("image/") && (
                        <img
                          src={parsed.url}
                          alt={parsed.name}
                          className="max-w-xs rounded-md mt-2"
                        />
                      )}

                      {parsed.mime.startsWith("video/") && (
                        <video
                          src={parsed.url}
                          controls
                          className="max-w-xs rounded-md mt-2"
                        />
                      )}
                    </div>
                  ) : msg.sender._id === "ai" ? (
                    WriteAiMessage(msg.message)
                  ) : (
                    msg.message
                  )}
                </div>
              );
            })}
          </div>

          <div className="fixed bottom-0 w-93 absolute left-0 p-3">
            <div className="relative flex items-end gap-2 w-full">
              {/* Emoji functionality */}
              {showEmojiPicker && (
                <div className="absolute bottom-14 left-2 z-50 bg-white rounded-lg shadow-lg">
                  <EmojiPicker
                    theme="dark"
                    onEmojiClick={(emojiData) => {
                      setmessage((prev) => prev + emojiData.emoji);
                      setShowEmojiPicker(false);
                    }}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="p-1 text-xl bg-gray-200 rounded-full hover:bg-gray-300"
              >
                😀
              </button>

              {/* File Upload Button & Input */}
              <input
                type="file"
                multiple
                className="hidden"
                id="fileInput"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files.length) return;

                  for (const file of files) {
                    const formData = new FormData();
                    formData.append("file", file);

                    const res = await axios.post("/api/upload", formData, {
                      headers: { "Content-Type": "multipart/form-data" },
                    });

                    const cloudUrl = res.data.url;

                    sendMessage("project-message", {
                      message: JSON.stringify({
                        type: "file",
                        url: cloudUrl,
                        name: file.name,
                        mime: file.type,
                      }),
                      sender: user,
                    });

                    setMessages((prev) => [
                      ...prev,
                      {
                        sender: user,
                        message: JSON.stringify({
                          type: "file",
                          url: cloudUrl,
                          name: file.name,
                          mime: file.type,
                        }),
                      },
                    ]);
                  }

                  e.target.value = ""; // reset input
                }}
              />

              <button
                type="button"
                onClick={() => document.getElementById("fileInput").click()}
                className="p-1 text-xl bg-gray-200 rounded-full hover:bg-gray-300"
              >
                📎
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setmessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (e.shiftKey || e.ctrlKey) return;
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Enter message"
                rows={1}
                className="flex-grow bg-white p-2 px-4 rounded-xl border-none outline-none text-black resize-none overflow-hidden"
              />

              {/* Send Button */}
              <button className="ml-1" onClick={send}>
                <i
                  className="ri-send-plane-fill"
                  style={{ fontSize: "30px", color: "white" }}
                ></i>
              </button>
            </div>
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

      <section className="right bg-red-50 flex-grow h-full text-black flex">
        <div className="explorer h-full max-w-64 min-w-52 bg-slate-200 overflow-auto">
          <div className="file-tree w-full mt-0 p-2">
            {Object.entries(fileTree).map(([name, node]) => (
              
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
          <div className="top flex justify-between w-full shadow-sm">
           
            <div className="files flex">
               <button
                   onClick={() => {
                    setIsToolPanelOpen((prev) => !prev)
                  }}
                   className={`p-2 px-3 rounded-none ${
                     isToolPanelOpen
                       ? "bg-gray-600 text-white"
                       : "bg-gray-300 text-black"
                   } hover:bg-gray-400`}
                   title="Open Drawing Tools"
                 >
                   <PencilIcon  className="w-5 h-5 text-black" />
               </button>
              {openFiles.map((file, index) => (
                <div
                  key={index}
                  className={`tree-element cursor-pointer px-3 py-1 flex items-center gap-2 bg-slate-300 rounded-none ${
                    currentFile === file ? "bg-slate-400" : ""
                  }`}
                >
                  <p
                    className="font-semibold text-lg cursor-pointer"
                    onClick={() => {
                      setCurrentFile(file)
                      setIsToolPanelOpen(false)

                    }}
                  >
                    {file}
                  </p>
                  <button
                    onClick={() => {
                      setOpenFiles((prev) => prev.filter((f) => f !== file));

                      // If the closed file is the one currently open, clear or open next available file
                      if (currentFile === file) {
                        const remainingFiles = openFiles.filter(
                          (f) => f !== file
                        );
                        setCurrentFile(
                          remainingFiles.length > 0 ? remainingFiles[0] : null
                        );
                      }
                    }}
                    className="ml-2 text-gray-600 hover:text-red-500"
                  >
                    <i
                      className="ri-close-line "
                      style={{ fontSize: "22px" }}
                    ></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="actions flex gap-2">
              {/* --- LOADING STATE (Show Spinner) --- */}
              {isRunning && !runProcess && (
                <button
                  disabled
                  className="p-2 px-4 rounded-md bg-gray-400 text-white cursor-not-allowed flex items-center gap-2"
                >
                  {/* Spinner Animation */}
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Loading...
                </button>
              )}

              {/* --- RUNNING STATE (Show Stop Button) --- */}
              {runProcess && (
                <button
                  onClick={() => {
                    runProcess.kill();
                    setRunProcess(null);
                    setIframeUrl(null);
                    setIsRunning(false);
                    console.log("⛔ Server stopped.");
                    setMessages((prev) => [
                      ...prev,
                      {
                        sender: { email: "System" },
                        message: "⛔ Server stopped.",
                      },
                    ]);
                  }}
                  className="p-2 px-4 rounded-md bg-red-500 text-white hover:bg-red-600"
                >
                  KILL
                </button>
              )}

              {/* --- IDLE STATE (Show Run & Clear Buttons) --- */}
              {!isRunning && !runProcess && (
                <>
                  {/* Run Button */}
                  <button
                    // Inside your Run button onClick
                    onClick={async () => {
                      try {
                        setIsRunning(true); // show spinner
                    
                        // Check if package.json exists in fileTree
                        if (!fileTree["package.json"]) {
                          throw new Error(
                            "❌ package.json not found! Please add a package.json in the root of your project."
                          );
                        }
                    
                        // Mount the files
                        await webContainer.mount(fileTree);
                        console.log("✅ Files mounted, installing dependencies...");
                    
                        // Install dependencies
                        const installProcess = await webContainer.spawn("npm", ["install"]);
                        await installProcess.exit;
                    
                        console.log("✅ Dependencies installed, starting server...");
                    
                        // Start the server
                        const tempRunProcess = await webContainer.spawn("npm", ["start"]);
                        tempRunProcess.output.pipeTo(
                          new WritableStream({
                            write(chunk) {
                              console.log(chunk);
                            },
                          })
                        );
                    
                        setRunProcess(tempRunProcess);
                    
                        // Listen for server-ready event
                        webContainer.on("server-ready", (port, url) => {
                          console.log(`🚀 Server running at ${url}`);
                          setIframeUrl(url);
                          setMessages((prev) => [
                            ...prev,
                            {
                              sender: { email: "System" },
                              message: `🚀 Server started at ${url}`,
                            },
                          ]);
                          setIsRunning(false); // switch to running state (Stop button)
                        });
                      } catch (err) {
                        console.error(err);
                        setIsRunning(false);
                    
                        // Show error message in chat/message area
                        setMessages((prev) => [
                          ...prev,
                          {
                            sender: { email: "System" },
                            message: err.message,
                          },
                        ]);
                      }
                    }}

                    className="p-2 px-4 rounded-md bg-slate-500 text-white hover:bg-slate-600"
                  >
                    <i className="codicon codicon-run"></i>
                  </button>

                  {/* Clear Button */}
                  <button
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Are you sure you want to clear everything?"
                        )
                      )
                        return;

                      setRunProcess(null);
                      setIframeUrl(null);
                      <div className="actions flex gap-2">
                        {/* --- LOADING STATE (Show Spinner) --- */}
                        {isRunning && !runProcess && (
                          <button
                            disabled
                            className="p-2 px-4 rounded-md bg-gray-400 text-white cursor-not-allowed flex items-center gap-2"
                          >
                            {/* Spinner Animation */}
                            <svg
                              className="animate-spin h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              ></path>
                            </svg>
                            Loading...
                          </button>
                        )}

                        {/* --- RUNNING STATE (Show Stop Button) --- */}
                        {runProcess && (
                          <button
                            onClick={() => {
                              runProcess.kill();
                              setRunProcess(null);
                              setIframeUrl(null);
                              setIsRunning(false);
                              console.log("⛔ Server stopped.");
                              setMessages((prev) => [
                                ...prev,
                                {
                                  sender: { email: "System" },
                                  message: "⛔ Server stopped.",
                                },
                              ]);
                            }}
                            className="p-2 px-4 rounded-md bg-red-500 text-white hover:bg-red-600"
                          >
                            <i className="codicon codicon-stop"></i>
                          </button>
                        )}

                        {/* --- IDLE STATE (Show Run & Clear Buttons) --- */}
                        {!isRunning && !runProcess && (
                          <>
                            {/* Run Button */}
                            <button
                              onClick={async () => {
                                try {
                                  setIsRunning(true); // show spinner

                                  await webContainer.mount(fileTree);
                                  console.log(
                                    "✅ Files mounted, installing dependencies..."
                                  );

                                  const installProcess =
                                    await webContainer.spawn("npm", [
                                      "install",
                                    ]);
                                  await installProcess.exit;

                                  console.log(
                                    "✅ Dependencies installed, starting server..."
                                  );

                                  const tempRunProcess =
                                    await webContainer.spawn("npm", ["start"]);
                                  tempRunProcess.output.pipeTo(
                                    new WritableStream({
                                      write(chunk) {
                                        console.log(chunk);
                                      },
                                    })
                                  );

                                  setRunProcess(tempRunProcess);

                                  webContainer.on(
                                    "server-ready",
                                    (port, url) => {
                                      console.log(
                                        `🚀 Server running at ${url}`
                                      );
                                      setIframeUrl(url);
                                      setMessages((prev) => [
                                        ...prev,
                                        {
                                          sender: { email: "System" },
                                          message: `🚀 Server started at ${url}`,
                                        },
                                      ]);
                                      setIsRunning(false); // switch to running state (Stop button)
                                    }
                                  );
                                } catch (err) {
                                  console.error(
                                    "❌ Error running project:",
                                    err
                                  );
                                  setIsRunning(false);
                                }
                              }}
                              className="p-2 px-4 rounded-md bg-slate-500 text-white hover:bg-slate-600"
                            >
                              <i className="codicon codicon-run"></i>
                            </button>

                            {/* Clear Button */}
                            <button
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    "Are you sure you want to clear everything?"
                                  )
                                )
                                  return;

                                setRunProcess(null);
                                setIframeUrl(null);
                                setMessages([]); // clears logs/chat
                                console.clear();

                                console.log(
                                  "🧹 Cleared all logs, messages, and iframe."
                                );
                              }}
                              className="p-2 px-4 rounded-md bg-gray-500 text-white hover:bg-gray-600"
                            >
                              <i className="codicon codicon-refresh"></i>
                            </button>
                          </>
                        )}
                      </div>;

                      console.clear();

                      console.log("🧹 Cleared all logs, messages, and iframe.");
                    }}
                    className="p-2 px-4 rounded-md bg-gray-500 text-white hover:bg-gray-600"
                  >
                    <i className="codicon codicon-refresh"></i>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
          {isToolPanelOpen ? 
           (
            <div className="flex w-full h-full">
             {/* Left Tool Panel */}
             <div className=" w-35 bg-gray-200 border-r p-2 flex flex-col gap-2">
                  <input 
                    type="color" 
                    value={toolColor} 
                    onChange={(e) => setToolColor(e.target.value)} 
                    className="w-full h-10 cursor-pointer mb-2"
                  />

                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={toolWidth}
                    onChange={(e) => setToolWidth(Number(e.target.value))}
                    className="w-full"
                  />
                  <button onClick={() => setSelectedTool("pencil")} className="p-1 bg-white rounded-md hover:bg-gray-100">✏️ Pencil</button>
                  <button onClick={() => setSelectedTool("rectangle")} className="p-1 bg-white rounded-md hover:bg-gray-100">🔲 Rectangle</button>
                  <button onClick={() => setSelectedTool("circle")} className="p-1 bg-white rounded-md hover:bg-gray-100">⚪ Circle</button>
                  <button onClick={() => setSelectedTool("line")} className="p-1 bg-white rounded-md hover:bg-gray-100">📏 Line</button>
                  <button onClick={() => setSelectedTool("text")} className="p-1 bg-white rounded-md hover:bg-gray-100">🅰️ Text</button>
                  <button onClick={() => setSelectedTool("eraser")} className="p-1 bg-white rounded-md hover:bg-gray-100">🧽 Eraser</button>
                  <button onClick={() => setSelectedTool("paint")} className="p-1 bg-white rounded-md hover:bg-gray-100">🎨 Paint</button>
                  <button onClick={() => { shapes.current = [];                     
                     const canvas = document.getElementById("drawingCanvas");
                    const ctx = canvas.getContext("2d");
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                  }} className="p-1 bg-red-500 text-white rounded-md">🧹 Clear</button>
                  <button onClick={() => {
                       const canvas = document.getElementById("drawingCanvas");
                       const url = canvas.toDataURL("image/png");
                       const a = document.createElement("a");
                       a.href = url;
                       a.download = "drawing.png";
                       a.click();
                  }} className="p-1 bg-green-500 text-white rounded-md">💾 Save</button>
             </div>

                  {/* Canvas Area */}
                  <div className="flex-grow bg-white relative">
                    <canvas 
                      id="drawingCanvas" 
                      ref={canvasRef}
                      width={600}
                      height={400}
                      className="border border-gray-400 rounded-lg bg-white w-full h-full cursor-crosshair"
                      style={{
                         cursor: selectedTool === 'eraser' ? 'url(/eraser-cursor.png), auto' : 'crosshair',
                         cursor: selectedTool === "fill" ? "url('/image.png'), auto" : "crosshair"
      
      
                        }}
                    />
                    
                    {/* Inline Text Input */}
                    {textInputVisible && (
                      <input
                        type="text"
                        value={textInputValue}
                        onChange={(e) => setTextInputValue(e.target.value)}
                        onBlur={() => {
                          shapes.current.push({
                            type: "text",
                            text: textInputValue,
                            startX: textPosition.x,
                            startY: textPosition.y,
                            color: toolColor,
                            width: toolWidth || 16
                          });
                          setTextInputVisible(false);
                          setTextInputValue("");
                          redraw(canvasRef.current.getContext("2d"), canvasRef.current);
                        }}
                
                        onKeyDown={(e) => {
      if (e.key === "Enter") {
        // Draw text on canvas
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "black";
        ctx.font = "16px sans-serif";
        ctx.fillText(textInputValue, textPosition.x, textPosition.y);

        // Hide input after drawing
        setTextInputVisible(false);
      }
                        }}
                        // hide input when user clicks away
                        className="absolute border border-gray-400 p-1 bg-white"
                        
                        style={{ left: textPosition.x, top: textPosition.y,position: "absolute" }} // dynamically position where user clicked
                        autoFocus
                      />
                    )}


                  </div>

            </div>


           ) : 
           
           (
           <>
             {/* Original Code Editor + Iframe */}
             {fileTree[currentFile] && (
                     <div className="code-editor-area h-full max-w-full overflow-auto flex-grow bg-slate-50">
                <pre className="hljs h-full bg-blue-950 text-white rounded-none p-4 overflow-auto">
                  <code
                    className="hljs h-full outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const updatedContent = e.target.innerText;

                      const ft = {
                        ...fileTree,
                        [currentFile]: {
                          file: {
                            contents: updatedContent,
                          },
                        },
                      };

                      setFileTree(ft);
                      saveFileTree(ft);
                    }}
                    dangerouslySetInnerHTML={{
                      __html: (() => {
                        const code = fileTree[currentFile].file.contents;
                        const lang = getLanguageFromExtension(currentFile);
                        try {
                          if (lang) {
                            return hljs.highlight(code, { language: lang })
                              .value;
                          } else {
                            return hljs.highlightAuto(code).value;
                          }
                        } catch {
                          return code;
                        }
                      })(),
                    }}
                    style={{
                      whiteSpace: "pre-wrap",
                      paddingBottom: "25rem",
                      counterSet: "line-numbering",
                    }}
                  />
                </pre>
                     </div>
               )}

              { /* {iframeUrl && (
                <div className="flex min-w-96 flex-col h-full">
                  <div className="address-bar">
                    <input type="text" className="w-full p-2 px-4 bg-slate-200" value={iframeUrl} onChange={(e) => setIframeUrl(e.target.value)} />
                  </div>
                  <iframe src={iframeUrl} className="w-full h-full"></iframe>
                </div>
                )} */
               }
           </>
           )
          }
          </div>

        </div>

         
        {iframeUrl && webContainer && (
          <div className="flex min-w-96 flex-col h-full">
            <div className="address-bar">
              <input
                type="text"
                className="w-full p-2 px-4 bg-slate-200"
                value={iframeUrl}
                onChange={(e) => setIframeUrl(e.target.value)}
              />
            </div>
            <iframe src={iframeUrl} className="w-full h-full"></iframe>
          </div>
        )} 
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
