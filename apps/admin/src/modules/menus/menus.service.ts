import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMenuDto, UpdateMenuDto, NavigationMenu, MenuItemDto } from './dto/menu.dto';
import { Prisma } from '../../generated/prisma';

const MENU_KEY_PREFIX = 'menu:';
const NAVIGATION_CATEGORY = 'navigation';

const DEFAULT_HEADER_ITEMS: MenuItemDto[] = [
  { id: 'item-browse', label: 'Browse', href: '/browse', icon: 'compass', isVisible: true, order: 1 },
  { id: 'item-live', label: 'Live', href: '/live', icon: 'tv', isVisible: true, order: 2 },
  { id: 'item-reality', label: 'Reality', href: '/reality', icon: 'theater', isVisible: true, order: 3 },
  { id: 'item-movies', label: 'Movies', href: '/movies', icon: 'film', isVisible: true, order: 4 },
  { id: 'item-comedy', label: 'Comedy', href: '/comedy', icon: 'smile', isVisible: true, order: 5 },
  { id: 'item-creators', label: 'Creators', href: '/creators', icon: 'sparkles', isVisible: true, order: 6 },
  { id: 'item-sports', label: 'Sports', href: '/sports', icon: 'trophy', isVisible: true, order: 7 },
  { id: 'item-music', label: 'Music', href: '/music', icon: 'music', isVisible: true, order: 8 },
  // Explicitly marked isVisible: false (removed from menu as required)
  { id: 'item-games', label: 'Games', href: '/games', icon: 'gamepad', isVisible: false, order: 9 },
  { id: 'item-rewards', label: 'Rewards', href: '/rewards', icon: 'gift', isVisible: false, order: 10 },
  { id: 'item-borrow', label: 'Borrow', href: '/borrow', icon: 'wallet', isVisible: false, order: 11 },
];

const DEFAULT_PROFILE_ITEMS: MenuItemDto[] = [
  { id: 'prof-profile', label: 'Profile', href: '/profile', icon: 'user', isVisible: true, order: 1 },
  { id: 'prof-notifications', label: 'Notifications', href: '/notifications', icon: 'bell', isVisible: true, order: 2 },
  { id: 'prof-messages', label: 'Messages', href: '/messages', icon: 'messageSquare', isVisible: true, order: 3 },
  { id: 'prof-downloads', label: 'Downloads', href: '/downloads', icon: 'download', isVisible: true, order: 4 },
  { id: 'prof-recommendations', label: 'For You', href: '/recommendations', icon: 'sparkles', isVisible: true, order: 5 },
  { id: 'prof-leaderboard', label: 'Leaderboard', href: '/leaderboard', icon: 'trophy', isVisible: true, order: 6 },
  { id: 'prof-referral', label: 'Refer a Friend', href: '/referral', icon: 'gift', isVisible: true, order: 7 },
  { id: 'prof-tipping', label: 'My Tips', href: '/tipping', icon: 'heart', isVisible: true, order: 8 },
  { id: 'prof-premium', label: 'Premium', href: '/premium', icon: 'crown', isVisible: true, order: 9 },
  { id: 'prof-wallet', label: 'Wallet', href: '/wallet', icon: 'wallet', isVisible: true, order: 10 },
  { id: 'prof-subscription', label: 'Subscriptions', href: '/wallet/subscription-history', icon: 'refresh', isVisible: true, order: 11 },
  { id: 'prof-bundles', label: 'Bundles & Passes', href: '/bundles', icon: 'gift', isVisible: true, order: 12 },
  { id: 'prof-moderation', label: 'Moderation', href: '/moderation', icon: 'shield', isVisible: true, order: 13 },
  { id: 'prof-settings', label: 'Settings', href: '/settings', icon: 'settings', isVisible: true, order: 14 },
  // Explicitly marked isVisible: false
  { id: 'prof-rewards', label: 'Rewards', href: '/rewards', icon: 'star', isVisible: false, order: 15 },
  { id: 'prof-borrow', label: 'Borrow', href: '/borrow/account', icon: 'wallet', isVisible: false, order: 16 },
];

@Injectable()
export class MenusService {
  private readonly logger = new Logger(MenusService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private sanitizeId(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async ensureDefaults(): Promise<void> {
    try {
      const existing = await this.prisma.systemSettings.findUnique({
        where: { key: `${MENU_KEY_PREFIX}main-header` },
      });

      if (!existing) {
        this.logger.log('Seeding default navigation menus');
        const now = new Date().toISOString();

        const defaultHeader: NavigationMenu = {
          id: 'main-header',
          name: 'Main Header Navigation',
          location: 'header',
          description: 'Top header navigation bar on web platform',
          isActive: true,
          isDefault: true,
          items: DEFAULT_HEADER_ITEMS,
          createdAt: now,
          updatedAt: now,
        };

        const defaultProfile: NavigationMenu = {
          id: 'profile-menu',
          name: 'User Profile Menu',
          location: 'profile',
          description: 'Dropdown menu accessible from user avatar',
          isActive: true,
          isDefault: true,
          items: DEFAULT_PROFILE_ITEMS,
          createdAt: now,
          updatedAt: now,
        };

        await this.prisma.$transaction([
          this.prisma.systemSettings.upsert({
            where: { key: `${MENU_KEY_PREFIX}main-header` },
            create: {
              key: `${MENU_KEY_PREFIX}main-header`,
              value: defaultHeader as unknown as Prisma.InputJsonValue,
              category: NAVIGATION_CATEGORY,
              description: defaultHeader.description,
              isPublic: true,
            },
            update: {},
          }),
          this.prisma.systemSettings.upsert({
            where: { key: `${MENU_KEY_PREFIX}profile-menu` },
            create: {
              key: `${MENU_KEY_PREFIX}profile-menu`,
              value: defaultProfile as unknown as Prisma.InputJsonValue,
              category: NAVIGATION_CATEGORY,
              description: defaultProfile.description,
              isPublic: true,
            },
            update: {},
          }),
        ]);
      }
    } catch (err) {
      this.logger.warn(`Failed to seed default navigation menus: ${(err as Error).message}`);
    }
  }

  async listMenus(): Promise<NavigationMenu[]> {
    await this.ensureDefaults();

    const records = await this.prisma.systemSettings.findMany({
      where: {
        category: NAVIGATION_CATEGORY,
        key: { startsWith: MENU_KEY_PREFIX },
      },
      orderBy: { createdAt: 'asc' },
    });

    return records
      .map((r) => r.value as unknown as NavigationMenu)
      .filter((m) => m && typeof m === 'object' && m.id);
  }

  async getMenuById(id: string): Promise<NavigationMenu> {
    await this.ensureDefaults();

    const record = await this.prisma.systemSettings.findUnique({
      where: { key: `${MENU_KEY_PREFIX}${id}` },
    });

    if (!record) {
      throw new NotFoundException(`Menu with id "${id}" not found`);
    }

    return record.value as unknown as NavigationMenu;
  }

  async getPublicMenu(location: string): Promise<NavigationMenu | null> {
    await this.ensureDefaults();

    // Look for active menu matching location
    const menus = await this.listMenus();
    const match = menus.find((m) => m.location.toLowerCase() === location.toLowerCase() && m.isActive);

    if (!match) {
      return null;
    }

    return {
      ...match,
      items: match.items
        .filter((item) => item.isVisible)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    };
  }

  async createMenu(dto: CreateMenuDto, actorId?: string): Promise<NavigationMenu> {
    const rawId = this.sanitizeId(dto.name);
    if (!rawId) {
      throw new BadRequestException('Invalid menu name provided');
    }

    const id = rawId.startsWith('menu-') ? rawId : `menu-${rawId}`;
    const key = `${MENU_KEY_PREFIX}${id}`;

    const existing = await this.prisma.systemSettings.findUnique({
      where: { key },
    });

    if (existing) {
      throw new BadRequestException(`A menu with id "${id}" already exists`);
    }

    const now = new Date().toISOString();
    const newMenu: NavigationMenu = {
      id,
      name: dto.name,
      location: dto.location,
      description: dto.description || '',
      isActive: dto.isActive ?? true,
      isDefault: false,
      items: (dto.items || []).map((item, index) => ({
        ...item,
        id: item.id || `item-${Date.now()}-${index}`,
        order: item.order ?? index + 1,
        isVisible: item.isVisible ?? true,
      })),
      createdAt: now,
      updatedAt: now,
    };

    await this.prisma.systemSettings.create({
      data: {
        key,
        value: newMenu as unknown as Prisma.InputJsonValue,
        category: NAVIGATION_CATEGORY,
        description: dto.description,
        isPublic: true,
      },
    });

    this.logger.log(`Created menu "${newMenu.name}" (${newMenu.id}) by actor ${actorId}`);
    return newMenu;
  }

  async updateMenu(id: string, dto: UpdateMenuDto, actorId?: string): Promise<NavigationMenu> {
    const existing = await this.getMenuById(id);
    const now = new Date().toISOString();

    const updatedMenu: NavigationMenu = {
      ...existing,
      name: dto.name ?? existing.name,
      location: dto.location ?? existing.location,
      description: dto.description ?? existing.description,
      isActive: dto.isActive ?? existing.isActive,
      items: (dto.items || []).map((item, index) => ({
        ...item,
        id: item.id || `item-${Date.now()}-${index}`,
        order: item.order ?? index + 1,
        isVisible: item.isVisible ?? true,
      })),
      updatedAt: now,
    };

    await this.prisma.systemSettings.update({
      where: { key: `${MENU_KEY_PREFIX}${id}` },
      data: {
        value: updatedMenu as unknown as Prisma.InputJsonValue,
        description: updatedMenu.description,
      },
    });

    this.logger.log(`Updated menu "${updatedMenu.name}" (${id}) by actor ${actorId}`);
    return updatedMenu;
  }

  async deleteMenu(id: string, actorId?: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.getMenuById(id);

    if (existing.isDefault) {
      throw new BadRequestException(`Cannot delete default platform menu "${existing.name}". You can hide or edit its items instead.`);
    }

    await this.prisma.systemSettings.delete({
      where: { key: `${MENU_KEY_PREFIX}${id}` },
    });

    this.logger.log(`Deleted menu "${existing.name}" (${id}) by actor ${actorId}`);
    return { success: true, message: `Menu "${existing.name}" deleted successfully` };
  }
}
