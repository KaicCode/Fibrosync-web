import {
  Delete,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Body,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Returns the profile of the authenticated user.' })
  getMe(@CurrentUser('sub') userId: string): Promise<unknown> {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Updates the profile of the authenticated user.' })
  updateMe(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<unknown> {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('me/settings')
  @ApiOperation({ summary: 'Returns the settings of the authenticated user.' })
  getMySettings(@CurrentUser('sub') userId: string): Promise<unknown> {
    return this.usersService.getSettings(userId);
  }

  @Patch('me/settings')
  @ApiOperation({ summary: 'Updates the settings of the authenticated user.' })
  updateMySettings(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserSettingsDto,
  ): Promise<unknown> {
    return this.usersService.updateSettings(userId, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lists platform users. Admin only.' })
  listUsers(@Query() query: UserQueryDto): Promise<unknown> {
    return this.usersService.listUsers(query);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Creates a new platform user. Admin only.' })
  createUser(@Body() dto: CreateAdminUserDto): Promise<unknown> {
    return this.usersService.createAdminUser(dto);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Returns a specific user. Admin only.' })
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<unknown> {
    return this.usersService.findPublicById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Updates a specific user. Admin only.' })
  updateByAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAdminUserDto,
  ): Promise<unknown> {
    return this.usersService.updateUserByAdmin(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deletes a specific user account. Admin only.' })
  removeByAdmin(
    @CurrentUser('sub') adminUserId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ message: string }> {
    return this.usersService.softDeleteUser(adminUserId, id);
  }
}
