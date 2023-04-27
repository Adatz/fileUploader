import { useState, useEffect } from "react";
import axios from "axios";

import "./App.css";

// UPLOAD THE FILE CHOSEN
const postFile = async ({ file }) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const result = await axios.post("http://localhost:8080/files", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return result.data;
  } catch (error) {
    alert(`Error occurred: ${error.message} 
          Invalid file types or file size restrictions.`);
    throw error;
  }
}

// DELETE THE FILE CHOSEN
async function deleteFile(key) {
  try {
    const response = await axios.delete(`http://localhost:8080/files/${key}`);
    console.log(response.data);
  } catch (error) {
    console.log(error);
  }
}

function App() {
  const [selectedFile, setSelectedFile] = useState();
  const [files, setFiles] = useState([]);
  const [data, setData] = useState([]);

// FETCH THE UPLOADED FILES
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:8080/files");
        setData(response.data);
      } catch (error) {
        setError(error);
      }
    };
    fetchData();
  }, []);

// UPLOAD FILE TO SERVER
  const submit = async (event) => {
    event.preventDefault();
    const result = await postFile({ file: selectedFile });
    setFiles([result.file, ...files]);
    alert(`File Successfuly Uploaded`);
    window.location.reload(false);
  };

  // CHOOSE FILE 
  const fileToSelect = (event) => {
    const selectedFile = event.target.files[0];
    setSelectedFile(selectedFile);
  };

  // DELETE THE SELECTED FILE
  const handleDelete = async (key) => {
    try {
      await deleteFile(key);
      setData(data.filter((file) => file.name !== key));
      alert(`File Successfuly Deleted`);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <div className="">
        <form onSubmit={submit} className="flex flex-col items-center mt-8">
          <div className="">
            <label
              htmlFor="file"
              className="block text-gray-700 font-bold mb-2"
            >
              Choose a file:
            </label>
            <input
              id="file"
              onChange={fileToSelect}
              type="file"
              className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <button
            type="submit"
            className="bg-black text-white rounded-lg py-2 px-6 mt-8 hover:bg-gray-800 focus:outline-none focus:shadow-outline"
          >
            Submit
          </button>
        </form>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {data.map((file) => (
          <div key={file._id} className="p-4 border rounded-lg m-8">
            <p className="font-bold">{file.name}</p>
            <a
              href={file.url}
              className="mt-2 py-2 px-4 bg-[#149911] text-white rounded hover:bg-[#244f26] m-4 "
            >
              Download
            </a>
            <button
              onClick={() => handleDelete(file.name)}
              className="mt-2 py-2 px-4 bg-[#bd1f21] text-white rounded hover:bg-[#4f0000]"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
