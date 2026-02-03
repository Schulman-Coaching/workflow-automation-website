import { IsString, IsOptional, IsInt, IsBoolean, IsArray, ValidateNested, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ConditionType {
  SENDER_DOMAIN = 'sender_domain',
  SUBJECT_CONTAINS = 'subject_contains',
  CATEGORY = 'category',
  NO_REPLY_WITHIN = 'no_reply_within',
}

export class FollowUpConditionDto {
  @IsEnum(ConditionType)
  type: ConditionType;

  @IsString()
  value: string;
}

export class CreateFollowUpRuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FollowUpConditionDto)
  conditions: FollowUpConditionDto[];

  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  followUpDays?: number = 3;

  @IsString()
  @IsOptional()
  reminderTemplate?: string;
}

export class UpdateFollowUpRuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FollowUpConditionDto)
  @IsOptional()
  conditions?: FollowUpConditionDto[];

  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  followUpDays?: number;

  @IsString()
  @IsOptional()
  reminderTemplate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateEmailFollowUpDto {
  @IsEnum(['none', 'pending', 'due', 'completed', 'snoozed'])
  status: 'none' | 'pending' | 'due' | 'completed' | 'snoozed';

  @IsOptional()
  @Type(() => Date)
  dueAt?: Date;
}

export class FollowUpRuleResponseDto {
  id: string;
  name: string | null;
  conditions: FollowUpConditionDto[];
  followUpDays: number;
  reminderTemplate: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class FollowUpEmailResponseDto {
  id: string;
  subject: string | null;
  fromAddress: string | null;
  fromName: string | null;
  receivedAt: Date;
  followUpStatus: string;
  followUpDueAt: Date | null;
  aiCategory: string | null;
  aiPriority: number | null;
  aiSuggestedAction: string | null;
}
