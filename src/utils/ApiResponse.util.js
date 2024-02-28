class ApiResponse {
    constructor(success, data, message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }
}

export {ApiResponse};