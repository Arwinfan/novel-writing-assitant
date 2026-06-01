/**
 * 角色图片服务 - 上传 + AI 生成
 */
import { useAIStore } from '../stores/aiStore';

/** 图片生成选项 */
export interface ImageGenOptions {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024';
  style?: 'vivid' | 'natural';
}

const MAX_AVATAR_SIZE = 512; // 最大尺寸（正方形）
const AVATAR_QUALITY = 0.85;

export const imageService = {
  /**
   * 从 File 读取并压缩为 base64
   */
  async uploadAndCompress(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = Math.min(img.width, img.height, MAX_AVATAR_SIZE);
          canvas.width = size;
          canvas.height = size;

          const ctx = canvas.getContext('2d')!;
          // 居中裁剪为正方形
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);

          resolve(canvas.toDataURL('image/jpeg', AVATAR_QUALITY));
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * AI 生成角色图片（调用 OpenAI 兼容的图片 API）
   */
  async generateImage(options: ImageGenOptions): Promise<string> {
    const config = useAIStore.getState().config;

    // 尝试使用专用图片生成 API
    const imageEndpoint = config.imageGenEndpoint || config.apiEndpoint.replace('/chat/completions', '/images/generations');
    const imageApiKey = config.imageGenApiKey || config.apiKey;

    if (!imageApiKey) {
      throw new Error('请先在 AI 设置中配置 API Key');
    }

    const fullPrompt = `角色外观图：${options.prompt}。动漫风格，半身像，高质量插图，精细细节。`;
    const size = options.size || '512x512';

    try {
      const response = await fetch(imageEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${imageApiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: fullPrompt,
          n: 1,
          size,
          quality: 'standard',
          style: options.style || 'vivid',
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
        throw new Error(err.error?.message || `图片生成失败 (${response.status})`);
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;
      if (!imageUrl) throw new Error('未获取到图片URL');

      // 下载图片并转为 base64
      const imgResponse = await fetch(imageUrl);
      const blob = await imgResponse.blob();
      return await this.uploadAndCompress(new File([blob], 'avatar.png', { type: 'image/png' }));
    } catch (e: any) {
      if (e.message.includes('请先')) throw e;
      // 如果 OpenAI 格式失败，尝试通用 LLM 接口（生成描述性 SVG）
      console.warn('图片API不可用，尝试用LLM生成...', e.message);
      return this.generateFallbackSVG(options.prompt);
    }
  },

  /**
   * 降级方案：用 LLM 生成 SVG 占位图
   */
  async generateFallbackSVG(prompt: string): Promise<string> {
    const config = useAIStore.getState().config;
    if (!config.apiKey) {
      throw new Error('请先在 AI 设置中配置 API Key');
    }

    const svgPrompt = `根据以下角色描述生成一个简单的 SVG 头像（纯色背景+简洁符号+首字母，不要文字描述，只输出SVG代码）：
角色：${prompt.slice(0, 200)}

要求：
- 圆形头像，背景使用与角色性格相符的颜色
- 中间放置与角色相关的简洁符号
- SVG 尺寸 256x256
- 只输出 SVG 代码，不要任何解释`;

    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: svgPrompt }],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM 请求失败 (${response.status})`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    // 提取 SVG
    const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgMatch[0])));
    }
    
    throw new Error('LLM 未生成有效 SVG');
  },
};
