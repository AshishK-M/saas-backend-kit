import { FastifyInstance, FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { AuthService } from './express';
import { JWTPayload } from './types';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload & { id: string };
  }
}

export function registerAuthPlugin(fastify: FastifyInstance, options: { authService: AuthService }, done: HookHandlerDoneFunction) {
  const { authService } = options;

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = authService['jwtService'].verifyToken(token);
      request.user = {
        ...payload,
        id: payload.userId,
      };
    } catch (error) {
      return reply.status(401).send({ error: 'Invalid token' });
    }
  });

  fastify.decorate('requireUser', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
  });

  fastify.decorate('requireRole', (role: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Authentication required' });
      }
      const { rbacService } = await import('./rbac');
      if (!rbacService.hasRole(request.user.role, role)) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }
    };
  });

  fastify.decorate('requirePermission', (permission: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Authentication required' });
      }
      const { rbacService } = await import('./rbac');
      if (!rbacService.hasPermission(request.user.role, permission)) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }
    };
  });

  done();
}
