import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TrackCollection, TrackCollectionCreation, TrackCollectionUpdate } from '@rpg-maestro/rpg-maestro-api-contract';
import { TrackCollectionService } from './track-collection.service';
import { Role } from '../auth/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('track-collections')
@Controller('track-collections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrackCollectionController {
  constructor(private readonly trackCollectionService: TrackCollectionService) {}

  @Post()
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Create a new track collection (Admin only)' })
  @ApiResponse({ status: 201, description: 'The track collection has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiBearerAuth()
  async create(@Body() creation: TrackCollectionCreation, @Request() req: any): Promise<TrackCollection> {
    return this.trackCollectionService.create(creation, req.user.id);
  }

  @Get()
  @Roles([Role.ADMIN, Role.MAESTRO, Role.MINSTREL])
  @ApiOperation({ summary: 'Get all track collections' })
  @ApiResponse({ status: 200, description: 'Return all track collections.' })
  @ApiBearerAuth()
  async getAll(): Promise<TrackCollection[]> {
    return this.trackCollectionService.getAll();
  }

  @Get(':id')
  @Roles([Role.ADMIN, Role.MAESTRO, Role.MINSTREL])
  @ApiOperation({ summary: 'Get a track collection by ID' })
  @ApiResponse({ status: 200, description: 'Return the track collection.' })
  @ApiResponse({ status: 404, description: 'Track collection not found.' })
  @ApiBearerAuth()
  async get(@Param('id') id: string): Promise<TrackCollection> {
    return this.trackCollectionService.get(id);
  }

  @Put(':id')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Update a track collection (Admin only)' })
  @ApiResponse({ status: 200, description: 'The track collection has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required or not the owner.' })
  @ApiResponse({ status: 404, description: 'Track collection not found.' })
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() update: TrackCollectionUpdate,
    @Request() req: any
  ): Promise<TrackCollection> {
    return this.trackCollectionService.update(id, update, req.user.id);
  }

  @Delete(':id')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Delete a track collection (Admin only)' })
  @ApiResponse({ status: 200, description: 'The track collection has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required or not the owner.' })
  @ApiResponse({ status: 404, description: 'Track collection not found.' })
  @ApiBearerAuth()
  async delete(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.trackCollectionService.delete(id, req.user.id);
  }
}
