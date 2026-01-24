import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitorNote } from './entities/visitor-note.entity';
import {
  CreateVisitorNoteDto,
  UpdateVisitorNoteDto,
} from '@live-chat/shared-dtos';
import { EventsGateway } from '../gateway/events.gateway';
import {
  WebSocketEvent,
  VisitorNotePayload,
  VisitorNoteDeletedPayload,
} from '@live-chat/shared-types';

@Injectable()
export class VisitorNotesService {
  constructor(
    @InjectRepository(VisitorNote)
    private readonly noteRepo: Repository<VisitorNote>,
    private readonly eventsGateway: EventsGateway
  ) {}

  async create(
    projectId: number,
    visitorId: number,
    authorId: string | null,
    dto: CreateVisitorNoteDto
  ): Promise<VisitorNote> {
    const note = this.noteRepo.create({
      visitorId,
      authorId, // TypeORM handles null correctly if column is nullable
      content: dto.content,
    });

    const savedNote = await this.noteRepo.save(note);
    // Fetch with author for payload
    const fullNote = await this.findOne(savedNote.id, projectId);

    // Emit event
    this.eventsGateway.emitToProject(
      projectId,
      WebSocketEvent.VISITOR_NOTE_ADDED,
      {
        visitorId,
        note: fullNote,
      } as VisitorNotePayload
    );

    return fullNote;
  }

  async findAll(projectId: number, visitorId: number): Promise<VisitorNote[]> {
    // Verify visitor belongs to project implicitly via relation query if needed,
    // but here we trust controller to check permissions or we add where clause.
    // However, VisitorNote doesn't have projectId. Visitor has.
    // So we should join visitor.
    return this.noteRepo.find({
      where: {
        visitorId,
        visitor: { projectId },
      },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, projectId: number): Promise<VisitorNote> {
    const note = await this.noteRepo.findOne({
      where: { id, visitor: { projectId } },
      relations: ['author', 'visitor'],
    });
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return note;
  }

  async update(
    id: string,
    projectId: number,
    dto: UpdateVisitorNoteDto
  ): Promise<VisitorNote> {
    const note = await this.findOne(id, projectId);
    if (dto.content) {
      note.content = dto.content;
    }
    const updated = await this.noteRepo.save(note);

    this.eventsGateway.emitToProject(
      projectId,
      WebSocketEvent.VISITOR_NOTE_UPDATED,
      {
        visitorId: note.visitorId,
        note: updated,
      } as VisitorNotePayload
    );

    return updated;
  }

  async remove(id: string, projectId: number): Promise<void> {
    const note = await this.findOne(id, projectId);
    await this.noteRepo.remove(note);

    this.eventsGateway.emitToProject(
      projectId,
      WebSocketEvent.VISITOR_NOTE_DELETED,
      {
        visitorId: note.visitorId,
        noteId: id,
      } as VisitorNoteDeletedPayload
    );
  }
}
