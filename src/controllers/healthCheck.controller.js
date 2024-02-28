import {ApiResponse} from '../utils/ApiResponse.util.js'
import {ApiError} from '../utils/ApiError.util.js'

const healthCheckControllerGet = (req, res) => {
  res.status(200).send('Server is up and running');
};

const healthCheckControllerPost = (req, res) => {

  const file = req.file;
  if(!file){
    throw new ApiError(400, 'Please upload an image');
  }
  res
  .status(200)
  .json(new ApiResponse(200,file.originalname, 'Health check image uploaded successfully'));
  
};



export { healthCheckControllerGet,healthCheckControllerPost };