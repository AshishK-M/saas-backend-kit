describe('Response Module', () => {
  let mockResponse: any;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  test('should have ResponseHelper defined', () => {
    const { ResponseHelper } = require('../dist/response');
    
    expect(ResponseHelper).toBeDefined();
    expect(ResponseHelper.success).toBeDefined();
    expect(ResponseHelper.error).toBeDefined();
  });

  test('should send success response', () => {
    const { ResponseHelper } = require('../dist/response');
    
    ResponseHelper.success(mockResponse, { data: 'test' }, 'Success');
    
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      data: { data: 'test' },
      message: 'Success'
    });
  });

  test('should send created response', () => {
    const { ResponseHelper } = require('../dist/response');
    
    ResponseHelper.created(mockResponse, { id: 1 }, 'Created');
    
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 1 },
      message: 'Created'
    });
  });

  test('should send error response', () => {
    const { ResponseHelper } = require('../dist/response');
    
    ResponseHelper.error(mockResponse, 'Error occurred', 400);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Error occurred'
    });
  });

  test('should send bad request response', () => {
    const { ResponseHelper } = require('../dist/response');
    
    ResponseHelper.badRequest(mockResponse, 'Invalid input');
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid input'
    });
  });

  test('should send unauthorized response', () => {
    const { ResponseHelper } = require('../dist/response');
    
    ResponseHelper.unauthorized(mockResponse, 'Not authenticated');
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
  });

  test('should send forbidden response', () => {
    const { ResponseHelper } = require('../dist/response');
    
    ResponseHelper.forbidden(mockResponse, 'Access denied');
    
    expect(mockResponse.status).toHaveBeenCalledWith(403);
  });

  test('should send not found response', () => {
    const { ResponseHelper } = require('../dist/response');
    
    ResponseHelper.notFound(mockResponse, 'Resource not found');
    
    expect(mockResponse.status).toHaveBeenCalledWith(404);
  });

  test('should send paginated response', () => {
    const { ResponseHelper } = require('../dist/response');
    
    const data = [{ id: 1 }, { id: 2 }];
    ResponseHelper.paginated(mockResponse, data, 1, 10, 25);
    
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      data,
      meta: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3
      }
    });
  });
});
