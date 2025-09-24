import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { 
  Wand2, Download, Users, Skull, Shield, Eye, Zap, RefreshCw, Plus, Minus, Filter, Search, Shuffle, 
  AlertTriangle, CheckCircle, Clock, BookOpen, Settings, Target, History, Share2, Brain, 
  BarChart3, Calendar, Moon, Sun, ChevronDown, ChevronUp, Lightbulb, Link
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Character {
  id: string;
  name: string;
  name_en: string;
  team: 'townsfolk' | 'outsider' | 'minion' | 'demon';
  ability: string;
  setup?: string;
  flavor?: string;
  edition?: string;
  firstNight?: number;
  otherNight?: number;
  reminders?: string[];
  jinx?: Array<{
    id: string;
    reason: string;
  }>;
  tags?: string[];
  complexity?: 'simple' | 'medium' | 'complex';
}

interface ScriptData {
  name: string;
  name_en: string;
  author: string;
  description: string;
  characters: Character[];
  meta?: {
    playerCount: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
  };
}

const PLAYER_COUNTS = [
  { value: 5, townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
  { value: 6, townsfolk: 3, outsider: 1, minion: 1, demon: 1 },
  { value: 7, townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
  { value: 8, townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
  { value: 9, townsfolk: 5, outsider: 2, minion: 1, demon: 1 },
  { value: 10, townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
  { value: 11, townsfolk: 7, outsider: 1, minion: 2, demon: 1 },
  { value: 12, townsfolk: 7, outsider: 2, minion: 2, demon: 1 },
  { value: 13, townsfolk: 9, outsider: 0, minion: 3, demon: 1 },
  { value: 14, townsfolk: 9, outsider: 1, minion: 3, demon: 1 },
  { value: 15, townsfolk: 9, outsider: 2, minion: 3, demon: 1 }
];

const TEAM_COLORS = {
  townsfolk: 'bg-blue-100 text-blue-800 border-blue-200',
  outsider: 'bg-orange-100 text-orange-800 border-orange-200',
  minion: 'bg-red-100 text-red-800 border-red-200',
  demon: 'bg-purple-100 text-purple-800 border-purple-200'
};

const TEAM_NAMES = {
  townsfolk: '村民',
  outsider: '外来者',
  minion: '爪牙',
  demon: '恶魔'
};

const TEAM_ICONS = {
  townsfolk: Shield,
  outsider: Eye,
  minion: Zap,
  demon: Skull
};

const GENERATION_MODES = {
  random: '随机生成',
  manual: '手动选择',
  hybrid: '混合模式'
};

const CHARACTER_EDITIONS = {
  tb: '麻烦酿造',
  snv: '暴乱之夜',
  bmr: '坏月亮',
  experimental: '实验性角色',
  custom: '自定义角色'
};

const CHARACTER_COMPLEXITIES = {
  simple: '简单',
  medium: '中等',
  complex: '复杂'
};

export function ScriptGenerator() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
  const [manualSelectedCharacters, setManualSelectedCharacters] = useState<Character[]>([]);
  const [generationMode, setGenerationMode] = useState<'random' | 'manual' | 'hybrid'>('random');
  const [scriptData, setScriptData] = useState<ScriptData>({
    name: '',
    name_en: '',
    author: '',
    description: '',
    characters: [],
    meta: {
      playerCount: 7,
      difficulty: 'beginner',
      tags: []
    }
  });
  const [activeTab, setActiveTab] = useState('comprehensive');
  const [viewMode, setViewMode] = useState<'comprehensive' | 'detailed'>('comprehensive');
  const [showValidation, setShowValidation] = useState(false);
  const [scriptHistory, setScriptHistory] = useState<ScriptData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [nightOrder, setNightOrder] = useState<{ first: Character[], other: Character[] }>({ first: [], other: [] });
  
  // 筛选和搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEdition, setSelectedEdition] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [selectedTeams, setSelectedTeams] = useState<string[]>(['townsfolk', 'outsider', 'minion', 'demon']);

  // 获取角色数据
  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-010255fd/characters`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCharacters(data.characters || []);
        console.log('Loaded characters:', data.characters?.length);
      } else {
        // 使用模拟数据
        const mockCharacters = getMockCharacters();
        setCharacters(mockCharacters);
        toast.warning('使用模拟角色数据');
      }
    } catch (error) {
      console.error('Failed to fetch characters:', error);
      const mockCharacters = getMockCharacters();
      setCharacters(mockCharacters);
      toast.error('获取角色数据失败，使用模拟数据');
    } finally {
      setLoading(false);
    }
  };

  const getMockCharacters = (): Character[] => [
    // 村民
    {
      id: 'chef',
      name: '厨师',
      name_en: 'Chef',
      team: 'townsfolk',
      ability: '你能得知有多少对邪恶玩家彼此相邻而坐。',
      firstNight: 39,
      otherNight: 0,
      edition: 'tb',
      complexity: 'simple',
      tags: ['information', 'setup']
    },
    {
      id: 'empath',
      name: '共情者',
      name_en: 'Empath',
      team: 'townsfolk',
      ability: '每个夜晚，你能得知与你相邻的两名存活玩家中有多少名邪恶玩家。',
      firstNight: 50,
      otherNight: 69,
      edition: 'tb',
      complexity: 'simple',
      tags: ['information', 'detection']
    },
    {
      id: 'fortune_teller',
      name: '占卜师',
      name_en: 'Fortune Teller',
      team: 'townsfolk',
      ability: '每个夜晚，选择两名玩家：你能得知他们其中是否有恶魔。会有一名善良玩家始终被你的能力误判为恶魔。',
      firstNight: 51,
      otherNight: 70,
      edition: 'tb',
      complexity: 'medium',
      tags: ['information', 'detection', 'false-positive']
    },
    {
      id: 'investigator',
      name: '调查员',
      name_en: 'Investigator',
      team: 'townsfolk',
      ability: '你能得知有多少名爪牙在你的两名邻座玩家之间（按顺时针方向）。',
      firstNight: 52,
      otherNight: 0,
      edition: 'tb',
      complexity: 'simple',
      tags: ['information', 'setup']
    },
    {
      id: 'librarian',
      name: '图书管理员',
      name_en: 'Librarian',
      team: 'townsfolk',
      ability: '你能得知两名玩家中的一名是哪个外来者，或得知没有外来者在场。',
      firstNight: 53,
      otherNight: 0,
      edition: 'tb',
      complexity: 'simple',
      tags: ['information', 'setup']
    },
    {
      id: 'mayor',
      name: '市长',
      name_en: 'Mayor',
      team: 'townsfolk',
      ability: '如果只有三名存活玩家且今天没有处决，你的阵营获胜。如果你死于处决，另一名玩家可能会立即被处决。',
      firstNight: 0,
      otherNight: 0,
      edition: 'tb',
      complexity: 'medium',
      tags: ['win-condition', 'execution']
    },
    {
      id: 'monk',
      name: '僧侣',
      name_en: 'Monk',
      team: 'townsfolk',
      ability: '每个夜晚*，选择除你以外的一名玩家：恶魔今晚不能选择该玩家。',
      firstNight: 28,
      otherNight: 37,
      edition: 'tb',
      complexity: 'simple',
      tags: ['protection', 'active']
    },
    {
      id: 'ravenkeeper',
      name: '渡鸦管理员',
      name_en: 'Ravenkeeper',
      team: 'townsfolk',
      ability: '如果你死于恶魔的袭击，你能得知一名玩家的角色。',
      firstNight: 0,
      otherNight: 47,
      edition: 'tb',
      complexity: 'simple',
      tags: ['information', 'death-trigger']
    },
    {
      id: 'slayer',
      name: '猎手',
      name_en: 'Slayer',
      team: 'townsfolk',
      ability: '每局游戏限一次，在白天时，公开选择一名玩家：如果该玩家是恶魔，该玩家死亡。',
      firstNight: 0,
      otherNight: 0,
      edition: 'tb',
      complexity: 'simple',
      tags: ['killing', 'one-time', 'day-action']
    },
    {
      id: 'soldier',
      name: '士兵',
      name_en: 'Soldier',
      team: 'townsfolk',
      ability: '你不会死于恶魔的能力。',
      firstNight: 0,
      otherNight: 0,
      edition: 'tb',
      complexity: 'simple',
      tags: ['protection', 'passive']
    },
    {
      id: 'undertaker',
      name: '殡仪员',
      name_en: 'Undertaker',
      team: 'townsfolk',
      ability: '每个夜晚*（首个夜晚除外），你能得知前一天白天死于处决的玩家的角色。',
      firstNight: 0,
      otherNight: 78,
      edition: 'tb',
      complexity: 'simple',
      tags: ['information', 'execution']
    },
    {
      id: 'virgin',
      name: '处女',
      name_en: 'Virgin',
      team: 'townsfolk',
      ability: '你第一次被提名时，如果提名你的玩家是村民，该玩家被处决。',
      firstNight: 0,
      otherNight: 0,
      edition: 'tb',
      complexity: 'medium',
      tags: ['protection', 'nomination', 'execution']
    },
    {
      id: 'washerwoman',
      name: '洗衣妇',
      name_en: 'Washerwoman',
      team: 'townsfolk',
      ability: '你能得知两名玩家中的一名是哪个村民，或得知他们都不是村民。',
      firstNight: 56,
      otherNight: 0,
      edition: 'tb',
      complexity: 'simple',
      tags: ['information', 'setup']
    },
    // 外来者
    {
      id: 'butler',
      name: '管家',
      name_en: 'Butler',
      team: 'outsider',
      ability: '每个夜晚，选择一名玩家（不能是你自己）：明天你只能投票给该玩家。',
      firstNight: 40,
      otherNight: 60,
      edition: 'tb',
      complexity: 'medium',
      tags: ['voting', 'restriction']
    },
    {
      id: 'drunk',
      name: '酒鬼',
      name_en: 'Drunk',
      team: 'outsider',
      ability: '你以为你是一个村民角色，但实际上不是。你不知道你是酒鬼。',
      firstNight: 0,
      otherNight: 0,
      edition: 'tb',
      complexity: 'complex',
      tags: ['madness', 'hidden']
    },
    {
      id: 'recluse',
      name: '隐士',
      name_en: 'Recluse',
      team: 'outsider',
      ability: '你可能被善良玩家的能力误判为邪恶，或被视为爪牙或恶魔。',
      firstNight: 0,
      otherNight: 0,
      edition: 'tb',
      complexity: 'medium',
      tags: ['false-positive', 'detection']
    },
    {
      id: 'saint',
      name: '圣者',
      name_en: 'Saint',
      team: 'outsider',
      ability: '如果你死于处决，你的阵营失败。',
      firstNight: 0,
      otherNight: 0,
      edition: 'tb',
      complexity: 'simple',
      tags: ['win-condition', 'execution']
    },
    // 爪牙
    {
      id: 'baron',
      name: '男爵',
      name_en: 'Baron',
      team: 'minion',
      ability: '会有额外的外来者在场。[+2外来者]',
      setup: true,
      firstNight: 0,
      otherNight: 0,
      edition: 'tb',
      complexity: 'simple',
      tags: ['setup', 'modifier']
    },
    {
      id: 'poisoner',
      name: '投毒者',
      name_en: 'Poisoner',
      team: 'minion',
      ability: '每个夜晚，选择一名玩家：该玩家中毒直到下个黄昏。',
      firstNight: 19,
      otherNight: 8,
      edition: 'tb',
      complexity: 'medium',
      tags: ['poisoning', 'debuff']
    },
    {
      id: 'scarlet_woman',
      name: '红唇女郎',
      name_en: 'Scarlet Woman',
      team: 'minion',
      ability: '如果恶魔死亡时有5名及以上的存活玩家，你变成该恶魔。',
      firstNight: 0,
      otherNight: 22,
      edition: 'tb',
      complexity: 'medium',
      tags: ['transformation', 'backup']
    },
    {
      id: 'spy',
      name: '间谍',
      name_en: 'Spy',
      team: 'minion',
      ability: '每个夜晚，你能得知魔典。你可能被善良玩家的能力误判为善良，或被视为村民或外来者。',
      firstNight: 58,
      otherNight: 77,
      edition: 'tb',
      complexity: 'complex',
      tags: ['information', 'false-positive', 'grimoire']
    },
    // 恶魔
    {
      id: 'imp',
      name: '小恶魔',
      name_en: 'Imp',
      team: 'demon',
      ability: '每个夜晚*，选择一名玩家：该玩家死亡。如果你自杀，一名爪牙变成小恶魔。',
      firstNight: 24,
      otherNight: 32,
      edition: 'tb',
      complexity: 'medium',
      tags: ['killing', 'transformation']
    }
  ];

  const generateScript = () => {
    if (!scriptData.name.trim()) {
      toast.error('请输入剧本名称');
      return;
    }

    if (!scriptData.author.trim()) {
      toast.error('请输入作者名称');
      return;
    }

    setGenerating(true);

    // 模拟生成延迟
    setTimeout(() => {
      const playerCount = scriptData.meta?.playerCount || 7;
      const distribution = PLAYER_COUNTS.find(pc => pc.value === playerCount);
      
      if (!distribution) {
        toast.error('不支持的玩家数量');
        setGenerating(false);
        return;
      }

      let selectedChars: Character[] = [];

      if (generationMode === 'manual') {
        // 手动模式：使用手动选择的角色
        selectedChars = [...manualSelectedCharacters];
        
        // 验证手动选择的角色数量是否正确
        const counts = {
          townsfolk: selectedChars.filter(c => c.team === 'townsfolk').length,
          outsider: selectedChars.filter(c => c.team === 'outsider').length,
          minion: selectedChars.filter(c => c.team === 'minion').length,
          demon: selectedChars.filter(c => c.team === 'demon').length
        };

        const errors = [];
        if (counts.townsfolk !== distribution.townsfolk) errors.push(`村民需要${distribution.townsfolk}个，当前${counts.townsfolk}个`);
        if (counts.outsider !== distribution.outsider) errors.push(`外来者需要${distribution.outsider}个，当前${counts.outsider}个`);
        if (counts.minion !== distribution.minion) errors.push(`爪牙需要${distribution.minion}个，当前${counts.minion}个`);
        if (counts.demon !== distribution.demon) errors.push(`恶魔需要${distribution.demon}个，当前${counts.demon}个`);

        if (errors.length > 0) {
          toast.error(`角色配置不正确：${errors.join('，')}`);
          setGenerating(false);
          return;
        }
      } else if (generationMode === 'hybrid') {
        // 混合模式：基于手动选择的角��，随机填充剩余位置
        const manualCounts = {
          townsfolk: manualSelectedCharacters.filter(c => c.team === 'townsfolk').length,
          outsider: manualSelectedCharacters.filter(c => c.team === 'outsider').length,
          minion: manualSelectedCharacters.filter(c => c.team === 'minion').length,
          demon: manualSelectedCharacters.filter(c => c.team === 'demon').length
        };

        selectedChars = [...manualSelectedCharacters];

        // 为每个阵营随机填充剩余位置
        Object.entries(distribution).forEach(([team, needed]) => {
          if (team !== 'value' && typeof needed === 'number') {
            const currentCount = manualCounts[team as keyof typeof manualCounts];
            const remaining = needed - currentCount;
            
            if (remaining > 0) {
              const availableChars = filteredCharacters
                .filter(c => c.team === team)
                .filter(c => !selectedChars.some(selected => selected.id === c.id));
              
              const randomChars = shuffleArray(availableChars).slice(0, remaining);
              selectedChars.push(...randomChars);
            }
          }
        });
      } else {
        // 随机模式：完全随机生成
        const availableByTeam = {
          townsfolk: filteredCharacters.filter(c => c.team === 'townsfolk'),
          outsider: filteredCharacters.filter(c => c.team === 'outsider'),
          minion: filteredCharacters.filter(c => c.team === 'minion'),
          demon: filteredCharacters.filter(c => c.team === 'demon')
        };

        // 选择恶魔
        const demons = shuffleArray([...availableByTeam.demon]).slice(0, distribution.demon);
        selectedChars.push(...demons);

        // 选择爪牙
        const minions = shuffleArray([...availableByTeam.minion]).slice(0, distribution.minion);
        selectedChars.push(...minions);

        // 选择外来者
        const outsiders = shuffleArray([...availableByTeam.outsider]).slice(0, distribution.outsider);
        selectedChars.push(...outsiders);

        // 选择村民
        const townsfold = shuffleArray([...availableByTeam.townsfolk]).slice(0, distribution.townsfolk);
        selectedChars.push(...townsfold);
      }

      setSelectedCharacters(selectedChars);
      setScriptData(prev => ({
        ...prev,
        characters: selectedChars
      }));
      
      generateNightOrder();
      setActiveTab(viewMode === 'comprehensive' ? 'comprehensive' : 'preview');
      toast.success(`成功生成 ${playerCount} 人剧本！`);
      setGenerating(false);
    }, 1500);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  // 筛选角色
  const filteredCharacters = characters.filter(char => {
    // 搜索筛选
    if (searchTerm && !char.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !char.name_en.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !char.ability.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // 版本筛选
    if (selectedEdition !== 'all' && char.edition !== selectedEdition) {
      return false;
    }
    
    // 复杂度筛选
    if (selectedComplexity !== 'all' && char.complexity !== selectedComplexity) {
      return false;
    }
    
    // 阵营筛选
    if (!selectedTeams.includes(char.team)) {
      return false;
    }
    
    return true;
  });

  // 手动选择角色
  const toggleCharacterSelection = (character: Character) => {
    const isSelected = manualSelectedCharacters.some(c => c.id === character.id);
    if (isSelected) {
      setManualSelectedCharacters(prev => prev.filter(c => c.id !== character.id));
    } else {
      setManualSelectedCharacters(prev => [...prev, character]);
    }
  };

  // 按阵营自动填充
  const autoFillByTeam = (team: string, count: number) => {
    const teamChars = filteredCharacters.filter(c => c.team === team);
    const currentTeamChars = manualSelectedCharacters.filter(c => c.team === team);
    const needed = count - currentTeamChars.length;
    
    if (needed > 0) {
      const available = teamChars.filter(c => !manualSelectedCharacters.some(selected => selected.id === c.id));
      const randomSelected = shuffleArray(available).slice(0, needed);
      setManualSelectedCharacters(prev => [...prev, ...randomSelected]);
    } else if (needed < 0) {
      // 移除多余的角色
      const toRemove = currentTeamChars.slice(needed);
      setManualSelectedCharacters(prev => 
        prev.filter(c => !toRemove.some(r => r.id === c.id))
      );
    }
  };

  // 清空选择
  const clearSelection = () => {
    setManualSelectedCharacters([]);
  };

  // 随机填充剩余位置
  const randomFillRemaining = () => {
    const playerCount = scriptData.meta?.playerCount || 7;
    const distribution = PLAYER_COUNTS.find(pc => pc.value === playerCount);
    if (!distribution) return;

    const currentCounts = {
      townsfolk: manualSelectedCharacters.filter(c => c.team === 'townsfolk').length,
      outsider: manualSelectedCharacters.filter(c => c.team === 'outsider').length,
      minion: manualSelectedCharacters.filter(c => c.team === 'minion').length,
      demon: manualSelectedCharacters.filter(c => c.team === 'demon').length
    };

    // 自动填充每个阵营
    Object.entries(distribution).forEach(([team, needed]) => {
      if (team !== 'value' && typeof needed === 'number') {
        autoFillByTeam(team, needed);
      }
    });
  };

  // 剧本验证功能
  const validateScript = () => {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    if (!scriptData.name.trim()) issues.push('缺少剧本名称');
    if (!scriptData.author.trim()) issues.push('缺少作者信息');
    if (selectedCharacters.length === 0) issues.push('没有选择任何角色');
    
    const playerCount = scriptData.meta?.playerCount || 7;
    const distribution = PLAYER_COUNTS.find(pc => pc.value === playerCount);
    
    if (distribution) {
      const counts = {
        townsfolk: selectedCharacters.filter(c => c.team === 'townsfolk').length,
        outsider: selectedCharacters.filter(c => c.team === 'outsider').length,
        minion: selectedCharacters.filter(c => c.team === 'minion').length,
        demon: selectedCharacters.filter(c => c.team === 'demon').length
      };

      if (counts.townsfolk !== distribution.townsfolk) issues.push(`村民数量不正确: 需要${distribution.townsfolk}，当前${counts.townsfolk}`);
      if (counts.outsider !== distribution.outsider) issues.push(`外来者数量不正确: 需要${distribution.outsider}，当前${counts.outsider}`);
      if (counts.minion !== distribution.minion) issues.push(`爪牙数量不正确: 需要${distribution.minion}，当前${counts.minion}`);
      if (counts.demon !== distribution.demon) issues.push(`恶魔数量不正确: 需要${distribution.demon}，当前${counts.demon}`);
    }
    
    // 检查角色冲突和协同
    const charIds = selectedCharacters.map(c => c.id);
    if (charIds.includes('drunk') && charIds.includes('baron')) {
      warnings.push('酒鬼和男爵同时在场可能会造成混乱');
    }
    
    if (charIds.includes('spy') && charIds.includes('recluse')) {
      warnings.push('间谍和隐士都会影响信息类角色的判断');
    }

    return { issues, warnings };
  };

  // 生成夜间行动顺序
  const generateNightOrder = () => {
    const firstNight = selectedCharacters
      .filter(c => c.firstNight && c.firstNight > 0)
      .sort((a, b) => (a.firstNight || 0) - (b.firstNight || 0));
    
    const otherNight = selectedCharacters
      .filter(c => c.otherNight && c.otherNight > 0)
      .sort((a, b) => (a.otherNight || 0) - (b.otherNight || 0));
    
    setNightOrder({ first: firstNight, other: otherNight });
  };

  // 剧本模板
  const getScriptTemplates = () => [
    {
      name: '经典麻烦酿造',
      name_en: 'Classic Trouble Brewing',
      description: '适合新手的经典配置',
      playerCount: 7,
      characters: ['chef', 'empath', 'fortune_teller', 'investigator', 'librarian', 'mayor', 'monk', 
                  'ravenkeeper', 'slayer', 'soldier', 'undertaker', 'virgin', 'washerwoman', 
                  'butler', 'drunk', 'recluse', 'saint', 'baron', 'poisoner', 'scarlet_woman', 'spy', 'imp']
    },
    {
      name: '信息流强化',
      name_en: 'Information Heavy',
      description: '大量信息类角色，适合逻辑推理爱好者',
      playerCount: 9,
      characters: ['chef', 'empath', 'fortune_teller', 'investigator', 'librarian', 'undertaker', 'washerwoman',
                  'butler', 'drunk', 'baron', 'poisoner', 'spy', 'imp']
    },
    {
      name: '混乱制造者',
      name_en: 'Chaos Creator', 
      description: '包含大量干扰和混乱元素',
      playerCount: 8,
      characters: ['mayor', 'monk', 'ravenkeeper', 'slayer', 'soldier', 'virgin',
                  'drunk', 'recluse', 'saint', 'baron', 'poisoner', 'scarlet_woman', 'spy', 'imp']
    }
  ];

  // 应用模板
  const applyTemplate = (template: any) => {
    const templateChars = characters.filter(c => template.characters.includes(c.id));
    setSelectedCharacters(templateChars);
    setManualSelectedCharacters(templateChars);
    setScriptData(prev => ({
      ...prev,
      name: template.name,
      name_en: template.name_en,
      description: template.description,
      characters: templateChars,
      meta: {
        ...prev.meta!,
        playerCount: template.playerCount
      }
    }));
    toast.success(`已应用模板: ${template.name}`);
  };

  // 保存到历史记录
  const saveToHistory = () => {
    if (selectedCharacters.length === 0) {
      toast.error('没有可保存的剧本');
      return;
    }
    
    const newEntry = {
      ...scriptData,
      characters: selectedCharacters,
      meta: {
        ...scriptData.meta!,
        createdAt: new Date().toISOString()
      }
    };
    
    setScriptHistory(prev => [newEntry, ...prev.slice(0, 9)]); // 保留最近10个
    toast.success('已保存到历史记录');
  };

  // 从历史记录加载
  const loadFromHistory = (historyEntry: ScriptData) => {
    setScriptData(historyEntry);
    setSelectedCharacters(historyEntry.characters);
    setManualSelectedCharacters(historyEntry.characters);
    toast.success('已从历史记录加载');
  };

  // 智能推荐角色
  const getCharacterRecommendations = () => {
    const currentTeams = selectedCharacters.map(c => c.team);
    const recommendations: { character: Character, reason: string }[] = [];
    
    // 基于当前角色推荐
    if (selectedCharacters.some(c => c.id === 'fortune_teller')) {
      const recluse = characters.find(c => c.id === 'recluse');
      if (recluse && !selectedCharacters.some(c => c.id === 'recluse')) {
        recommendations.push({ character: recluse, reason: '与占卜师形成有趣的互动' });
      }
    }
    
    if (selectedCharacters.some(c => c.team === 'minion' && c.id === 'poisoner')) {
      const monk = characters.find(c => c.id === 'monk');
      if (monk && !selectedCharacters.some(c => c.id === 'monk')) {
        recommendations.push({ character: monk, reason: '可以对抗投毒者的干扰' });
      }
    }
    
    return recommendations.slice(0, 3);
  };

  const exportScript = () => {
    const validation = validateScript();
    if (validation.issues.length > 0) {
      toast.error(`剧本存在问题: ${validation.issues.join(', ')}`);
      return;
    }

    const exportData = {
      _meta: {
        name: scriptData.name,
        name_en: scriptData.name_en,
        author: scriptData.author,
        logo: "",
        description: scriptData.description
      },
      characters: selectedCharacters.map(char => ({
        id: char.id,
        name: char.name,
        name_en: char.name_en,
        team: char.team,
        ability: char.ability,
        setup: char.setup || false,
        firstNight: char.firstNight || 0,
        otherNight: char.otherNight || 0,
        reminders: char.reminders || [],
        jinx: char.jinx || []
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scriptData.name_en || scriptData.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // 自动保存到历史记录
    saveToHistory();
    toast.success('剧本已导出并保存到历史记录！');
  };

  const playerDistribution = PLAYER_COUNTS.find(pc => pc.value === (scriptData.meta?.playerCount || 7));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 计算完成进度
  const getProgress = () => {
    let completed = 0;
    let total = 5;
    
    if (scriptData.name.trim()) completed++;
    if (scriptData.author.trim()) completed++;
    if (selectedCharacters.length > 0) completed++;
    if (scriptData.description.trim()) completed++;
    
    const validation = validateScript();
    if (validation.issues.length === 0) completed++;
    
    return (completed / total) * 100;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              剧本生成器
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'comprehensive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('comprehensive');
                  setActiveTab('comprehensive');
                }}
              >
                <Target className="h-4 w-4 mr-1" />
                综合面板
              </Button>
              <Button
                variant={viewMode === 'detailed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('detailed');
                  setActiveTab('setup');
                }}
              >
                <Settings className="h-4 w-4 mr-1" />
                详细模式
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            根据血染钟楼规则自动生成平衡的剧本配置
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 进度指示器 */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">剧本完成度</span>
            <span className="text-sm text-muted-foreground">{Math.round(getProgress())}%</span>
          </div>
          <Progress value={getProgress()} className="mb-3" />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              {scriptData.name.trim() ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Clock className="h-3 w-3" />}
              剧本信息
            </div>
            <div className="flex items-center gap-1">
              {selectedCharacters.length > 0 ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Clock className="h-3 w-3" />}
              角色选择
            </div>
            <div className="flex items-center gap-1">
              {validateScript().issues.length === 0 ? <CheckCircle className="h-3 w-3 text-green-600" /> : <AlertTriangle className="h-3 w-3 text-orange-500" />}
              验证通过
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {viewMode === 'comprehensive' ? (
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="comprehensive">综合操作面板</TabsTrigger>
          </TabsList>
        ) : (
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup">基本设置</TabsTrigger>
            <TabsTrigger value="selection">角色选择</TabsTrigger>
            <TabsTrigger value="characters">角色库</TabsTrigger>
            <TabsTrigger value="preview">预览导出</TabsTrigger>
          </TabsList>
        )}

        {/* 综合面板 */}
        <TabsContent value="comprehensive" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：基本设置和快速操作 */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">基本设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">剧本名称</Label>
                    <Input
                      id="name"
                      value={scriptData.name}
                      onChange={(e) => setScriptData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="请输入剧本中文名称"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="author">作者</Label>
                    <Input
                      id="author"
                      value={scriptData.author}
                      onChange={(e) => setScriptData(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="请输入作者名称"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="playerCount">玩家数</Label>
                      <Select
                        value={scriptData.meta?.playerCount?.toString()}
                        onValueChange={(value) => setScriptData(prev => ({
                          ...prev,
                          meta: { ...prev.meta!, playerCount: parseInt(value) }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLAYER_COUNTS.map(pc => (
                            <SelectItem key={pc.value} value={pc.value.toString()}>
                              {pc.value} 人
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="generationMode">生成模式</Label>
                      <Select
                        value={generationMode}
                        onValueChange={(value: 'random' | 'manual' | 'hybrid') => setGenerationMode(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">随机</SelectItem>
                          <SelectItem value="manual">手动</SelectItem>
                          <SelectItem value="hybrid">混合</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">描述</Label>
                    <Textarea
                      id="description"
                      value={scriptData.description}
                      onChange={(e) => setScriptData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="描述剧本特色..."
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={generateScript} 
                    disabled={generating}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        生成剧本
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* 快速操作 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    快速操作
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setShowTemplates(!showTemplates)}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    剧本模板
                    {showTemplates ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                  </Button>
                  
                  {showTemplates && (
                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                      {getScriptTemplates().map((template, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => applyTemplate(template)}
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    历史记录 ({scriptHistory.length})
                    {showHistory ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                  </Button>

                  {showHistory && scriptHistory.length > 0 && (
                    <div className="space-y-1 pl-4 border-l-2 border-muted max-h-32 overflow-y-auto">
                      {scriptHistory.map((entry, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => loadFromHistory(entry)}
                        >
                          {entry.name || '未命名剧本'}
                        </Button>
                      ))}
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setShowValidation(!showValidation)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    剧本验证
                  </Button>

                  {selectedCharacters.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={generateNightOrder}
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      生成夜间顺序
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 中间：角色选择和配置 */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">角色配置</CardTitle>
                  <CardDescription>
                    {playerDistribution && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          村民: {playerDistribution.townsfolk}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          外来者: {playerDistribution.outsider}
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          爪牙: {playerDistribution.minion}
                        </div>
                        <div className="flex items-center gap-1">
                          <Skull className="h-3 w-3" />
                          恶魔: {playerDistribution.demon}
                        </div>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generationMode !== 'random' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="搜索角色..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={randomFillRemaining}
                        >
                          <Shuffle className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* 已选择的角色 */}
                      {manualSelectedCharacters.length > 0 && (
                        <div className="space-y-2">
                          <Label>已选择 ({manualSelectedCharacters.length})</Label>
                          <ScrollArea className="h-24 w-full border rounded-lg p-2">
                            <div className="flex flex-wrap gap-1">
                              {manualSelectedCharacters.map(char => {
                                const TeamIcon = TEAM_ICONS[char.team];
                                return (
                                  <Badge
                                    key={char.id}
                                    variant="secondary"
                                    className={`${TEAM_COLORS[char.team]} cursor-pointer text-xs`}
                                    onClick={() => toggleCharacterSelection(char)}
                                  >
                                    <TeamIcon className="h-3 w-3 mr-1" />
                                    {char.name}
                                    <Minus className="h-3 w-3 ml-1" />
                                  </Badge>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {/* 可选角色（简化版） */}
                      <div className="space-y-3">
                        {Object.entries(TEAM_NAMES).map(([team, teamName]) => {
                          const teamChars = filteredCharacters.filter(c => c.team === team).slice(0, 6);
                          const TeamIcon = TEAM_ICONS[team as keyof typeof TEAM_ICONS];
                          
                          if (teamChars.length === 0) return null;
                          
                          return (
                            <div key={team}>
                              <Label className="flex items-center gap-2 mb-2">
                                <TeamIcon className="h-4 w-4" />
                                {teamName}
                              </Label>
                              <div className="grid grid-cols-2 gap-1">
                                {teamChars.map(char => {
                                  const isSelected = manualSelectedCharacters.some(c => c.id === char.id);
                                  return (
                                    <div
                                      key={char.id}
                                      className={`p-2 rounded border cursor-pointer transition-all text-xs ${
                                        isSelected 
                                          ? `${TEAM_COLORS[char.team]} ring-1 ring-primary` 
                                          : `${TEAM_COLORS[char.team]} hover:ring-1 hover:ring-primary/50`
                                      }`}
                                      onClick={() => toggleCharacterSelection(char)}
                                    >
                                      <div className="font-medium">{char.name}</div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {char.ability.substring(0, 30)}...
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 右侧：预览和分析 */}
            <div className="lg:col-span-1 space-y-6">
              {selectedCharacters.length > 0 ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>剧本预览</span>
                        <Button onClick={exportScript} size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          导出
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm">
                        <div className="font-medium">{scriptData.name || '未命名剧本'}</div>
                        <div className="text-muted-foreground">{scriptData.author}</div>
                        <div className="text-muted-foreground">{selectedCharacters.length} 个角色</div>
                      </div>

                      <div className="space-y-2">
                        {Object.entries(TEAM_NAMES).map(([team, teamName]) => {
                          const teamChars = selectedCharacters.filter(c => c.team === team);
                          const TeamIcon = TEAM_ICONS[team as keyof typeof TEAM_ICONS];
                          
                          if (teamChars.length === 0) return null;
                          
                          return (
                            <div key={team}>
                              <div className="flex items-center gap-2 mb-1">
                                <TeamIcon className="h-3 w-3" />
                                <span className="text-xs font-medium">{teamName} ({teamChars.length})</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {teamChars.map(char => (
                                  <Badge key={char.id} variant="outline" className="text-xs">
                                    {char.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 验证结果 */}
                  {showValidation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">验证结果</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const validation = validateScript();
                          return (
                            <div className="space-y-2">
                              {validation.issues.length > 0 && (
                                <Alert>
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription>
                                    <div className="space-y-1">
                                      {validation.issues.map((issue, index) => (
                                        <div key={index} className="text-sm">• {issue}</div>
                                      ))}
                                    </div>
                                  </AlertDescription>
                                </Alert>
                              )}
                              
                              {validation.warnings.length > 0 && (
                                <Alert className="border-orange-200 bg-orange-50">
                                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                                  <AlertDescription>
                                    <div className="space-y-1">
                                      {validation.warnings.map((warning, index) => (
                                        <div key={index} className="text-sm">• {warning}</div>
                                      ))}
                                    </div>
                                  </AlertDescription>
                                </Alert>
                              )}
                              
                              {validation.issues.length === 0 && validation.warnings.length === 0 && (
                                <Alert className="border-green-200 bg-green-50">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <AlertDescription>
                                    剧本配置正确，可以开始游戏！
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}

                  {/* 夜间行动顺序 */}
                  {nightOrder.first.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          夜间顺序
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">首夜</Label>
                          <div className="space-y-1">
                            {nightOrder.first.map((char, index) => (
                              <div key={char.id} className="flex items-center gap-2 text-sm">
                                <Badge variant="outline" className="w-6 h-6 text-xs p-0 flex items-center justify-center">
                                  {index + 1}
                                </Badge>
                                {char.name}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {nightOrder.other.length > 0 && (
                          <div>
                            <Label className="text-xs">其他夜晚</Label>
                            <div className="space-y-1">
                              {nightOrder.other.map((char, index) => (
                                <div key={char.id} className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline" className="w-6 h-6 text-xs p-0 flex items-center justify-center">
                                    {index + 1}
                                  </Badge>
                                  {char.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* 智能推荐 */}
                  {(() => {
                    const recommendations = getCharacterRecommendations();
                    return recommendations.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            智能推荐
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {recommendations.map((rec, index) => (
                            <div key={index} className="p-2 border rounded text-sm">
                              <div className="font-medium">{rec.character.name}</div>
                              <div className="text-xs text-muted-foreground">{rec.reason}</div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })()}
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Wand2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">开始创建剧本</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      设置基本信息后点击"生成剧本"
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>剧本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">剧本名称</Label>
                  <Input
                    id="name"
                    value={scriptData.name}
                    onChange={(e) => setScriptData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="请输入剧本中文名称"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name_en">英文名称</Label>
                  <Input
                    id="name_en"
                    value={scriptData.name_en}
                    onChange={(e) => setScriptData(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="请输入剧本英文名称"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">作者</Label>
                  <Input
                    id="author"
                    value={scriptData.author}
                    onChange={(e) => setScriptData(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="请输入作者名称"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="playerCount">玩家数量</Label>
                  <Select
                    value={scriptData.meta?.playerCount?.toString()}
                    onValueChange={(value) => setScriptData(prev => ({
                      ...prev,
                      meta: { ...prev.meta!, playerCount: parseInt(value) }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAYER_COUNTS.map(pc => (
                        <SelectItem key={pc.value} value={pc.value.toString()}>
                          {pc.value} 人
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">难度</Label>
                  <Select
                    value={scriptData.meta?.difficulty}
                    onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                      setScriptData(prev => ({
                        ...prev,
                        meta: { ...prev.meta!, difficulty: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">新手</SelectItem>
                      <SelectItem value="intermediate">进阶</SelectItem>
                      <SelectItem value="advanced">高级</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="generationMode">生成模式</Label>
                  <Select
                    value={generationMode}
                    onValueChange={(value: 'random' | 'manual' | 'hybrid') => setGenerationMode(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">随机生成</SelectItem>
                      <SelectItem value="manual">手动选择</SelectItem>
                      <SelectItem value="hybrid">混合模式</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">剧本描述</Label>
                <Textarea
                  id="description"
                  value={scriptData.description}
                  onChange={(e) => setScriptData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="描述这个剧本的特色和玩法..."
                  rows={3}
                />
              </div>

              {playerDistribution && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {scriptData.meta?.playerCount} 人配置
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span>村民: {playerDistribution.townsfolk}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-orange-600" />
                      <span>外来者: {playerDistribution.outsider}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-red-600" />
                      <span>爪牙: {playerDistribution.minion}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skull className="h-4 w-4 text-purple-600" />
                      <span>恶魔: {playerDistribution.demon}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium mb-2">生成模式说明</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {generationMode === 'random' && (
                    <p>• <strong>随机生成</strong>：系统将完全随机选择角色，确保阵营平衡</p>
                  )}
                  {generationMode === 'manual' && (
                    <p>• <strong>手动选择</strong>：您需要在"角色选择"页面手动选择所有角色</p>
                  )}
                  {generationMode === 'hybrid' && (
                    <p>• <strong>混合模式</strong>：您可以手动选择部分角色，系统随机填充其余位置</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={generateScript} 
                  disabled={generating}
                  className="flex-1"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      生成剧本
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>角色选择</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    已选择: {manualSelectedCharacters.length}
                  </Badge>
                  {playerDistribution && (
                    <Badge variant="outline">
                      需要: {playerDistribution.townsfolk + playerDistribution.outsider + playerDistribution.minion + playerDistribution.demon}
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                {generationMode === 'manual' ? 
                  '请选择所有需要的角色，确保符合配置要求' : 
                  '选择您想要的角色，系统将自动填充其余位置'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 筛选控件 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">搜索角色</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="角色名称或能力..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edition">版本筛选</Label>
                  <Select value={selectedEdition} onValueChange={setSelectedEdition}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有版本</SelectItem>
                      {Object.entries(CHARACTER_EDITIONS).map(([key, name]) => (
                        <SelectItem key={key} value={key}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="complexity">复杂度</Label>
                  <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有难度</SelectItem>
                      {Object.entries(CHARACTER_COMPLEXITIES).map(([key, name]) => (
                        <SelectItem key={key} value={key}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>阵营筛选</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={selectedTeams.length === 4 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTeams(['townsfolk', 'outsider', 'minion', 'demon'])}
                    >
                      全部
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTeams([])}
                    >
                      清空
                    </Button>
                  </div>
                </div>
              </div>

              {/* 阵营筛选切换 */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(TEAM_NAMES).map(([team, teamName]) => {
                  const TeamIcon = TEAM_ICONS[team as keyof typeof TEAM_ICONS];
                  const isSelected = selectedTeams.includes(team);
                  return (
                    <Button
                      key={team}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTeams(prev => prev.filter(t => t !== team));
                        } else {
                          setSelectedTeams(prev => [...prev, team]);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <TeamIcon className="h-4 w-4" />
                      {teamName}
                    </Button>
                  );
                })}
              </div>

              {/* 快速操作 */}
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  <Minus className="h-4 w-4 mr-1" />
                  清空选择
                </Button>
                <Button variant="outline" size="sm" onClick={randomFillRemaining}>
                  <Shuffle className="h-4 w-4 mr-1" />
                  随机填充
                </Button>
                {playerDistribution && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => autoFillByTeam('townsfolk', playerDistribution.townsfolk)}
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      填充村民
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => autoFillByTeam('outsider', playerDistribution.outsider)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      填充外来者
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => autoFillByTeam('minion', playerDistribution.minion)}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      填充爪牙
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => autoFillByTeam('demon', playerDistribution.demon)}
                    >
                      <Skull className="h-4 w-4 mr-1" />
                      填充恶魔
                    </Button>
                  </>
                )}
              </div>

              {/* 已选择的角色 */}
              {manualSelectedCharacters.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">已选择的角色 ({manualSelectedCharacters.length})</h4>
                  <ScrollArea className="h-32 w-full border rounded-lg p-3">
                    <div className="flex flex-wrap gap-2">
                      {manualSelectedCharacters.map(char => {
                        const TeamIcon = TEAM_ICONS[char.team];
                        return (
                          <Badge
                            key={char.id}
                            variant="secondary"
                            className={`${TEAM_COLORS[char.team]} cursor-pointer`}
                            onClick={() => toggleCharacterSelection(char)}
                          >
                            <TeamIcon className="h-3 w-3 mr-1" />
                            {char.name}
                            <Minus className="h-3 w-3 ml-1" />
                          </Badge>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* 角色列表 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">可选角色 ({filteredCharacters.length})</h4>
                  <div className="text-sm text-muted-foreground">
                    点击角色卡片进行选择
                  </div>
                </div>
                
                {Object.entries(TEAM_NAMES).map(([team, teamName]) => {
                  const teamChars = filteredCharacters.filter(c => c.team === team);
                  const TeamIcon = TEAM_ICONS[team as keyof typeof TEAM_ICONS];
                  
                  if (teamChars.length === 0) return null;
                  
                  return (
                    <div key={team}>
                      <h5 className="font-medium mb-3 flex items-center gap-2">
                        <TeamIcon className="h-4 w-4" />
                        {teamName} ({teamChars.length})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {teamChars.map(char => {
                          const isSelected = manualSelectedCharacters.some(c => c.id === char.id);
                          return (
                            <div
                              key={char.id}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected 
                                  ? `${TEAM_COLORS[char.team]} ring-2 ring-offset-2 ring-primary` 
                                  : `${TEAM_COLORS[char.team]} hover:ring-1 hover:ring-primary`
                              }`}
                              onClick={() => toggleCharacterSelection(char)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium">{char.name}</div>
                                {isSelected && <Plus className="h-4 w-4 text-primary" />}
                              </div>
                              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                <span>{char.name_en}</span>
                                {char.complexity && (
                                  <Badge variant="outline" className="text-xs">
                                    {CHARACTER_COMPLEXITIES[char.complexity]}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm">{char.ability}</div>
                              {char.tags && char.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {char.tags.slice(0, 2).map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="characters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>可用角色 ({characters.length})</CardTitle>
              <CardDescription>
                当前可用的角色列表，生成时将从中随机选择
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.entries(TEAM_NAMES).map(([team, teamName]) => {
                const teamChars = characters.filter(c => c.team === team);
                const TeamIcon = TEAM_ICONS[team as keyof typeof TEAM_ICONS];
                
                return (
                  <div key={team} className="mb-6">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TeamIcon className="h-4 w-4" />
                      {teamName} ({teamChars.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {teamChars.map(char => (
                        <div
                          key={char.id}
                          className={`p-3 rounded-lg border ${TEAM_COLORS[char.team as keyof typeof TEAM_COLORS]}`}
                        >
                          <div className="font-medium">{char.name}</div>
                          <div className="text-xs text-muted-foreground mb-2">{char.name_en}</div>
                          <div className="text-sm">{char.ability}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {selectedCharacters.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{scriptData.name || '未命名剧本'}</span>
                    <Button onClick={exportScript}>
                      <Download className="h-4 w-4 mr-2" />
                      导出 JSON
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {scriptData.description || '暂无描述'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label>作者</Label>
                      <div className="text-sm font-medium">{scriptData.author}</div>
                    </div>
                    <div>
                      <Label>玩家数量</Label>
                      <div className="text-sm font-medium">{scriptData.meta?.playerCount} 人</div>
                    </div>
                    <div>
                      <Label>难度</Label>
                      <Badge variant="outline">
                        {scriptData.meta?.difficulty === 'beginner' ? '新手' :
                         scriptData.meta?.difficulty === 'intermediate' ? '进阶' : '高级'}
                      </Badge>
                    </div>
                    <div>
                      <Label>角色数量</Label>
                      <div className="text-sm font-medium">{selectedCharacters.length} 个</div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    {Object.entries(TEAM_NAMES).map(([team, teamName]) => {
                      const teamChars = selectedCharacters.filter(c => c.team === team);
                      const TeamIcon = TEAM_ICONS[team as keyof typeof TEAM_ICONS];
                      
                      if (teamChars.length === 0) return null;
                      
                      return (
                        <div key={team}>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <TeamIcon className="h-4 w-4" />
                            {teamName} ({teamChars.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {teamChars.map(char => (
                              <div
                                key={char.id}
                                className={`p-3 rounded-lg border ${TEAM_COLORS[char.team as keyof typeof TEAM_COLORS]}`}
                              >
                                <div className="font-medium">{char.name}</div>
                                <div className="text-xs text-muted-foreground mb-2">{char.name_en}</div>
                                <div className="text-sm">{char.ability}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Wand2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">还未生成剧本</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  请先在"基本设置"中配置剧本信息并生成剧本
                </p>
                <Button onClick={() => setActiveTab('setup')}>
                  前往设置
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}