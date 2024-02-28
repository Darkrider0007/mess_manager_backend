

const healthCheckControllerGet = (req, res) => {
  res.status(200).send('Server is up and running');
};

const healthCheckControllerPost = (req, res) => {
  
};



export { healthCheckControllerGet,healthCheckControllerPost };