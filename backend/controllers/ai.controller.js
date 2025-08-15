import ai from '../services/ai.service.js'


const getResult = async (req, res) => {
    try{

        const{ prompt} = req.query;
        const result = await ai(prompt);
        res.send(result)

    }catch(error){

     res.status(500).send({message: error.message})

    }
}

export default getResult ;