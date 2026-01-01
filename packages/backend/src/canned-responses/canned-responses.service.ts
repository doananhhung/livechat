import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CannedResponse } from './entities/canned-response.entity';
import { CreateCannedResponseDto, UpdateCannedResponseDto } from '@live-chat/shared-dtos';

@Injectable()
export class CannedResponsesService {
  constructor(
    @InjectRepository(CannedResponse)
    private readonly cannedResponseRepo: Repository<CannedResponse>,
  ) {}

  async create(projectId: number, dto: CreateCannedResponseDto): Promise<CannedResponse> {
    try {
      const response = this.cannedResponseRepo.create({
        projectId,
        ...dto,
      });
      return await this.cannedResponseRepo.save(response);
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new ConflictException('Shortcut already exists in this project');
      }
      throw error;
    }
  }

  async findAll(projectId: number): Promise<CannedResponse[]> {
    return this.cannedResponseRepo.find({ where: { projectId } });
  }

  async findOne(id: string, projectId: number): Promise<CannedResponse> {
    const response = await this.cannedResponseRepo.findOne({ where: { id, projectId } });
    if (!response) {
      throw new NotFoundException(`Canned response with ID ${id} not found`);
    }
    return response;
  }

  async update(id: string, projectId: number, dto: UpdateCannedResponseDto): Promise<CannedResponse> {
    const response = await this.findOne(id, projectId);
    Object.assign(response, dto);
    
    try {
      return await this.cannedResponseRepo.save(response);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Shortcut already exists in this project');
      }
      throw error;
    }
  }

  async remove(id: string, projectId: number): Promise<void> {
    const result = await this.cannedResponseRepo.delete({ id, projectId });
    if (result.affected === 0) {
      throw new NotFoundException(`Canned response with ID ${id} not found`);
    }
  }
}
