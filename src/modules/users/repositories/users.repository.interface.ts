import { User } from '../entities/user.entity';
import { UserCreateData, UserFilter, PaginationOptions, PaginatedResult } from './types';

export interface IUsersRepository {
  /**
   * Cria uma nova instância de usuário (sem persistir)
   */
  create(data: UserCreateData): User;

  /**
   * Salva um usuário no banco de dados
   */
  save(user: User): Promise<User>;

  /**
   * Busca um usuário por ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Busca um usuário por email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Busca um usuário por username
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Busca usuários com filtros e paginação
   */
  findAll(filters?: UserFilter, pagination?: PaginationOptions): Promise<PaginatedResult<User>>;

  /**
   * Remove um usuário
   */
  remove(user: User): Promise<void>;
}
