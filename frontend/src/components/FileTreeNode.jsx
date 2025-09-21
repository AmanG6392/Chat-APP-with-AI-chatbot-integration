const FileTreeNode = ({ name, node, fullPath, setCurrentFile, setOpenFiles }) =>
{
  const isFolder = node.folder;

  const handleClick = () => {
    if (!isFolder) {
      setCurrentFile(fullPath);
      setOpenFiles((prev) => {
        if (!prev.includes(fullPath)) {
          return [...prev, fullPath];
        }
        return prev;
      });
    }
  };

  return (
    <div className="ml-4">
      <div
        onClick={handleClick}
        className="cursor-pointer p-1 hover:bg-slate-300 rounded"
      >
        {isFolder ? "📂 " : "📄 "}
        {name}
      </div>

      {isFolder &&
        node.children &&
        Object.entries(node.children).map(([childName, childNode]) => (
          <FileTreeNode
            key={childName}
            name={childName}
            node={childNode}
            fullPath={`${fullPath}/${childName}`}
            setCurrentFile={setCurrentFile}
            setOpenFiles={setOpenFiles}
          />
        ))}
    </div>
  );
};

export default FileTreeNode