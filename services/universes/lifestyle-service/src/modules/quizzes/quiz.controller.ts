import {
  Inject,
  Controller,
  Get,
  Post,
  Request,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@azeebo/security';

import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@ApiTags('Quizzes')
@UseGuards(ServiceAuthGuard)
@Controller('quizzes')
export class QuizController {
  constructor(@Inject(QuizService) private readonly quizService: QuizService) {}

  @Get()
  @ApiOperation({ summary: 'List quizzes' })
  @ApiResponse({ status: 200, description: 'List of quizzes' })
  async getQuizzes(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string
  ) {
    return this.quizService.getQuizzes(
      Number(page) || 1,
      Number(limit) || 20,
      category,
      difficulty
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz details' })
  @ApiResponse({ status: 200, description: 'Quiz details' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async getQuiz(@Param('id') id: string) {
    return this.quizService.getQuiz(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a quiz' })
  @ApiResponse({ status: 201, description: 'Quiz created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createQuiz(@Request() req: { user: { id: string } }, @Body() data: CreateQuizDto) {
    return this.quizService.createQuiz(req.user.id, data);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a quiz' })
  @ApiResponse({ status: 200, description: 'Quiz started' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startQuiz(@Request() req: { user: { id: string } }, @Param('id') quizId: string) {
    return this.quizService.startQuiz(quizId, req.user.id);
  }

  @Post('attempts/:attemptId/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit quiz answers' })
  @ApiResponse({ status: 200, description: 'Quiz submitted' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitQuiz(@Param('attemptId') attemptId: string, @Body() body: SubmitQuizDto) {
    return this.quizService.submitQuiz(attemptId, body.answers);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get quiz leaderboard' })
  @ApiResponse({ status: 200, description: 'Quiz leaderboard' })
  async getLeaderboard(@Param('id') quizId: string, @Query('limit') limit?: number) {
    return this.quizService.getLeaderboard(quizId, Number(limit) || 10);
  }
}
