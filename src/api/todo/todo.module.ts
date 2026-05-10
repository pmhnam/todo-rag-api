import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoStatusController } from './controllers/todo-status.controller';
import { TodoController } from './controllers/todo.controller';
import { TodoStatusEntity } from './entities/todo-status.entity';
import { TodoEntity } from './entities/todo.entity';
import { TodoStatusService } from './services/todo-status.service';
import { TodoService } from './services/todo.service';

@Module({
  imports: [TypeOrmModule.forFeature([TodoEntity, TodoStatusEntity])],
  controllers: [TodoController, TodoStatusController],
  providers: [TodoService, TodoStatusService],
  exports: [TodoStatusService],
})
export class TodoModule {}
