 import React from "react"
 import AppRoutes from "./routes/AppRoutes"
 import { UserProvider } from "./context/User.context"


function App() {
  

  return (
    <>
   
      <UserProvider>

        <AppRoutes/>

      </UserProvider>
   
    </>
  )
}

export default App
