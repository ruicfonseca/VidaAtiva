#!/usr/bin/env python3
"""Gera as ilustrações SVG em img/ a partir das poses abaixo.

Cada pose é uma lista de elementos, em coordenadas 0..200 (y para baixo):
  ('tronco', [(x,y),...])      tronco, traço mais grosso
  ('corpo',  [(x,y),...])      membro normal
  ('alvo',   [(x,y),...])      zona alongada: cor de acento com halo
  ('elastico', [(x,y),...] | 'd')  elástico, cor própria
  ('cabeca', (x,y), r)
  ('apoio',  [(x,y),...])      parede, porta, cadeira
  ('seta',   (x1,y1), (x2,y2)) seta recta de direcção
  ('arco',   'd', (px,py), (qx,qy))  seta curva tracejada; a ponta aponta de p para q
  ('texto',  (x,y), 'legenda')

Correr: python3 ferramentas/gerar_ilustracoes.py
"""
import math, os

CHAO_Y = 176
LARG = {'tronco': 14, 'corpo': 11, 'alvo': 12, 'halo': 28, 'elastico': 5, 'apoio': 4, 'seta': 3.5, 'chao': 3}

def pts(p):
    return ' '.join(f'{x:g},{y:g}' for x, y in p)

def poly(cls, p, extra=''):
    if isinstance(p, str):
        return f'<path class="{cls}" stroke-width="{LARG[cls]}" d="{p}"{extra}/>'
    return f'<polyline class="{cls}" stroke-width="{LARG[cls]}" points="{pts(p)}"{extra}/>'

def ponta(p, q, tam=9):
    """Duas linhas de ponta de seta em q, vindas da direcção p->q."""
    ang = math.atan2(q[1] - p[1], q[0] - p[0])
    out = []
    for d in (math.radians(150), math.radians(-150)):
        a = ang + d
        out.append((q[0] + tam * math.cos(a), q[1] + tam * math.sin(a)))
    return f'<polyline class="seta" stroke-width="{LARG["seta"]}" points="{pts([out[0], q, out[1]])}"/>'

def svg(pose, legenda, chao=True):
    partes = []
    if chao:
        partes.append(f'<line class="chao" stroke-width="{LARG["chao"]}" x1="12" y1="{CHAO_Y}" x2="188" y2="{CHAO_Y}"/>')
    ordem = {'apoio': 0, 'halo': 1, 'tronco': 2, 'corpo': 3, 'alvo': 4, 'elastico': 5, 'cabeca': 6, 'seta': 7, 'arco': 7, 'texto': 8}
    itens = []
    for el in pose:
        tipo = el[0]
        if tipo == 'alvo':
            itens.append((ordem['halo'], poly('halo', el[1])))
        itens.append((ordem[tipo], el))
    itens.sort(key=lambda t: t[0])
    for _, el in itens:
        if isinstance(el, str):
            partes.append(el); continue
        tipo = el[0]
        if tipo in ('tronco', 'corpo', 'alvo', 'apoio'):
            partes.append(poly(tipo, el[1]))
        elif tipo == 'elastico':
            partes.append(poly('elastico', el[1]))
        elif tipo == 'cabeca':
            (x, y), r = el[1], el[2]
            partes.append(f'<circle class="cabeca" cx="{x}" cy="{y}" r="{r}" fill="currentColor" stroke="none"/>')
        elif tipo == 'seta':
            p, q = el[1], el[2]
            partes.append(f'<line class="seta" stroke-width="{LARG["seta"]}" x1="{p[0]}" y1="{p[1]}" x2="{q[0]}" y2="{q[1]}"/>')
            partes.append(ponta(p, q))
        elif tipo == 'arco':
            partes.append(f'<path class="seta" stroke-width="{LARG["seta"]}" stroke-dasharray="7 7" d="{el[1]}"/>')
            partes.append(ponta(el[2], el[3]))
        elif tipo == 'texto':
            (x, y), t = el[1], el[2]
            partes.append(f'<text class="legenda" x="{x}" y="{y}" font-size="11" fill="currentColor" stroke="none" text-anchor="middle" font-family="system-ui, sans-serif">{t}</text>')
    corpo = '\n'.join(partes)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="currentColor" '
            f'stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="{legenda}">\n{corpo}\n</svg>\n')

POSES = {}

POSES['isquiotibiais-sentado'] = ('Sentado, perna esticada, tronco inclinado para o pé', [
    ('tronco', [(74, 168), (116, 110)]),
    ('cabeca', (130, 94), 13),
    ('corpo', [(116, 110), (138, 138), (158, 158)]),
    ('corpo', [(74, 168), (46, 140), (88, 172)]),
    ('alvo', [(74, 168), (120, 170), (162, 168)]),
    ('corpo', [(162, 168), (166, 150)]),
    ('seta', (152, 100), (176, 128)),
])

POSES['quadricipite-pe'] = ('De pé, calcanhar puxado ao glúteo, mão na parede', [
    ('apoio', [(28, 28), (28, CHAO_Y)]),
    ('tronco', [(100, 106), (100, 52)]),
    ('cabeca', (100, 32), 13),
    ('corpo', [(100, 52), (66, 62), (32, 66)]),
    ('corpo', [(100, 52), (122, 82), (130, 116)]),
    ('corpo', [(100, 106), (100, 140), (100, CHAO_Y), (116, CHAO_Y)]),
    ('alvo', [(100, 106), (106, 140)]),
    ('corpo', [(106, 140), (130, 120), (134, 134)]),
    ('seta', (162, 112), (144, 112)),
])

POSES['gemeos-parede'] = ('De frente para a parede, perna de trás esticada, calcanhar no chão', [
    ('apoio', [(28, 20), (28, CHAO_Y)]),
    ('tronco', [(112, 100), (78, 58)]),
    ('cabeca', (66, 44), 13),
    ('corpo', [(78, 58), (32, 64)]),
    ('corpo', [(84, 68), (32, 78)]),
    ('corpo', [(112, 100), (84, 136), (84, CHAO_Y), (68, CHAO_Y)]),
    ('corpo', [(112, 100), (140, 138)]),
    ('alvo', [(140, 138), (166, CHAO_Y)]),
    ('corpo', [(166, CHAO_Y), (150, CHAO_Y)]),
    ('seta', (150, 100), (128, 100)),
])

POSES['flexores-anca-ajoelhado'] = ('Ajoelhado num joelho, outro pé à frente, anca avançada', [
    ('tronco', [(98, 106), (102, 52)]),
    ('cabeca', (103, 32), 13),
    ('corpo', [(102, 52), (90, 82), (68, 108)]),
    ('corpo', [(98, 106), (60, 112), (60, CHAO_Y), (44, CHAO_Y)]),
    ('alvo', [(98, 106), (128, CHAO_Y)]),
    ('corpo', [(128, CHAO_Y), (170, CHAO_Y), (176, 166)]),
    ('seta', (140, 96), (118, 96)),
])

POSES['gluteos-figura4'] = ('Deitado de costas, tornozelo sobre o joelho oposto, mãos a puxar a coxa', [
    ('cabeca', (26, 164), 13),
    ('tronco', [(44, 166), (108, 166)]),
    ('corpo', [(108, 166), (112, 108), (74, 96)]),
    ('alvo', [(108, 166), (158, 122)]),
    ('corpo', [(158, 122), (116, 124)]),
    ('corpo', [(44, 166), (70, 140), (104, 132)]),
    ('corpo', [(48, 172), (74, 150), (106, 142)]),
    ('seta', (150, 96), (126, 86)),
])

POSES['peitoral-ombreira'] = ('Antebraço na ombreira da porta, tronco rodado para o lado oposto', [
    ('apoio', [(142, 22), (142, CHAO_Y)]),
    ('tronco', [(96, 106), (96, 52)]),
    ('cabeca', (96, 32), 13),
    ('alvo', [(96, 52), (142, 52)]),
    ('corpo', [(142, 52), (142, 22)]),
    ('corpo', [(96, 52), (80, 86), (72, 114)]),
    ('corpo', [(96, 106), (114, 140), (122, CHAO_Y), (138, CHAO_Y)]),
    ('corpo', [(96, 106), (80, 140), (72, CHAO_Y), (56, CHAO_Y)]),
    ('seta', (76, 40), (54, 40)),
])

POSES['dorsal-crianca'] = ('Posição da criança, sentado nos calcanhares, braços esticados no chão', [
    ('corpo', [(118, CHAO_Y), (166, CHAO_Y), (174, 166)]),
    ('corpo', [(118, CHAO_Y), (150, 140)]),
    ('alvo', 'M150 140 Q112 106 78 138'),
    ('corpo', [(80, 146), (22, 172)]),
    ('corpo', [(86, 152), (30, CHAO_Y)]),
    ('cabeca', (58, 146), 12),
    ('seta', (136, 116), (160, 128)),
])

POSES['trapezio-pescoco'] = ('Cabeça inclinada para o ombro, mão pousada na cabeça', [
    ('apoio', [(52, 178), (148, 178)]),
    ('tronco', [(100, 178), (100, 96)]),
    ('corpo', [(62, 96), (138, 96)]),
    ('alvo', [(100, 96), (112, 78)]),
    ('cabeca', (122, 64), 14),
    ('corpo', [(138, 96), (168, 66), (124, 46)]),
    ('corpo', [(62, 96), (56, 150)]),
    ('seta', (72, 72), (94, 58)),
    ('seta', (46, 104), (46, 126)),
])

POSES['lombar-joelhos-peito'] = ('Deitado de costas, joelhos abraçados contra o peito', [
    ('cabeca', (26, 164), 13),
    ('tronco', [(44, 166), (86, 166)]),
    ('alvo', [(86, 166), (112, 166)]),
    ('corpo', [(112, 166), (86, 104), (128, 114)]),
    ('corpo', [(116, 172), (94, 112), (134, 122)]),
    ('corpo', [(44, 166), (60, 126), (100, 112)]),
    ('seta', (156, 98), (132, 92)),
])

POSES['rotacao-toracica-deitado'] = ('Visto de cima: deitado de lado, joelhos dobrados, braço de cima aberto num arco', [
    ('cabeca', (28, 100), 13),
    ('tronco', [(46, 100), (112, 100)]),
    ('corpo', [(112, 100), (142, 128), (116, 156)]),
    ('corpo', [(114, 106), (146, 136), (120, 164)]),
    ('corpo', [(50, 100), (54, 152)]),
    ('alvo', [(50, 100), (46, 44)]),
    ('arco', 'M62 152 A56 56 0 0 1 48 46', (36, 60), (48, 46)),
    ('texto', (100, 192), 'visto de cima'),
])

POSES['tornozelos-circulos'] = ('Sentado, perna esticada, pé a desenhar círculos', [
    ('tronco', [(68, 166), (78, 98)]),
    ('cabeca', (80, 80), 13),
    ('corpo', [(78, 98), (40, 170)]),
    ('corpo', [(68, 166), (48, 138), (86, CHAO_Y)]),
    ('corpo', [(68, 166), (114, 166), (152, 160)]),
    ('alvo', [(152, 160), (160, 140)]),
    ('arco', 'M162 124 A26 26 0 1 1 132 152', (128, 140), (132, 152)),
])

POSES['punhos-extensao'] = ('Braço esticado, palma para cima, outra mão a puxar os dedos', [
    ('tronco', [(100, 178), (100, 96)]),
    ('corpo', [(62, 96), (138, 96)]),
    ('corpo', [(100, 96), (100, 88)]),
    ('cabeca', (100, 72), 14),
    ('corpo', [(138, 96), (162, 96)]),
    ('alvo', [(162, 96), (186, 96)]),
    ('corpo', [(186, 96), (188, 112)]),
    ('corpo', [(62, 96), (108, 128), (184, 116)]),
    ('seta', (194, 128), (176, 134)),
])

# Com elástico
POSES['isquiotibiais-elastico-deitado'] = ('Deitado de costas, elástico no pé, perna esticada puxada para cima', [
    ('cabeca', (26, 164), 13),
    ('tronco', [(44, 166), (108, 166)]),
    ('corpo', [(108, 166), (148, 166), (184, 166), (186, 152)]),
    ('alvo', [(108, 166), (104, 118), (100, 66)]),
    ('corpo', [(100, 66), (88, 60)]),
    ('corpo', [(44, 166), (56, 138), (64, 120)]),
    ('corpo', [(48, 172), (60, 148), (70, 128)]),
    ('elastico', 'M62 118 L92 60 Q100 50 106 62 L70 128'),
    ('seta', (134, 104), (122, 80)),
])

POSES['adutores-elastico-deitado'] = ('Visto de cima: deitado de costas, elástico no pé, perna aberta para o lado', [
    ('cabeca', (28, 100), 13),
    ('tronco', [(46, 100), (112, 100)]),
    ('corpo', [(112, 100), (150, 100), (188, 100)]),
    ('alvo', [(112, 100), (148, 62), (176, 32)]),
    ('corpo', [(50, 100), (58, 64)]),
    ('corpo', [(50, 100), (52, 150)]),
    ('elastico', [(58, 62), (174, 30)]),
    ('seta', (150, 92), (170, 66)),
    ('texto', (100, 192), 'visto de cima'),
])

POSES['quadricipite-elastico-brucos'] = ('Deitado de bruços, elástico no tornozelo, calcanhar puxado ao glúteo', [
    ('cabeca', (26, 166), 13),
    ('tronco', [(44, 168), (108, 168)]),
    ('corpo', [(108, 168), (150, 168), (186, 168)]),
    ('alvo', [(108, 168), (150, 168)]),
    ('corpo', [(150, 168), (142, 120), (130, 112)]),
    ('corpo', [(44, 168), (56, 136), (62, 110)]),
    ('elastico', 'M140 118 Q100 92 64 108'),
    ('seta', (170, 132), (156, 112)),
])

POSES['gemeos-elastico-sentado'] = ('Sentado, perna esticada, elástico na planta do pé, dedos puxados para o corpo', [
    ('tronco', [(66, 166), (74, 100)]),
    ('cabeca', (76, 82), 13),
    ('corpo', [(66, 166), (46, 138), (84, CHAO_Y)]),
    ('corpo', [(66, 166), (112, 164)]),
    ('alvo', [(112, 164), (152, 160)]),
    ('corpo', [(152, 160), (156, 140)]),
    ('corpo', [(74, 100), (92, 122), (108, 120)]),
    ('elastico', [(106, 118), (156, 142)]),
    ('seta', (180, 130), (164, 136)),
])

POSES['peitoral-elastico-costas'] = ('Visto de costas: elástico seguro atrás das costas, braços esticados a afastar', [
    ('tronco', [(100, 178), (100, 96)]),
    ('corpo', [(62, 96), (138, 96)]),
    ('corpo', [(100, 96), (100, 88)]),
    ('cabeca', (100, 72), 14),
    ('alvo', [(62, 96), (44, 160)]),
    ('alvo', [(138, 96), (156, 160)]),
    ('elastico', 'M44 160 Q100 150 156 160'),
    ('seta', (34, 150), (28, 128)),
    ('seta', (166, 150), (172, 128)),
    ('texto', (100, 194), 'visto de costas'),
])

POSES['ombros-passagem-elastico'] = ('Elástico seguro largo, braços esticados a passar por cima da cabeça', [
    ('tronco', [(100, 178), (100, 96)]),
    ('corpo', [(100, 96), (100, 88)]),
    ('cabeca', (100, 72), 14),
    ('alvo', [(62, 96), (34, 44)]),
    ('alvo', [(138, 96), (166, 44)]),
    ('corpo', [(62, 96), (138, 96)]),
    ('elastico', [(34, 44), (166, 44)]),
    ('arco', 'M40 30 A64 40 0 0 1 160 30', (150, 26), (160, 30)),
])

POSES['dorsal-elastico-ancorado'] = ('Ajoelhado, elástico preso em cima, braço esticado, anca a ir para trás', [
    ('apoio', [(24, 20), (24, CHAO_Y)]),
    ('corpo', [(110, CHAO_Y), (160, CHAO_Y), (168, 166)]),
    ('corpo', [(110, CHAO_Y), (140, 142)]),
    ('tronco', [(140, 142), (104, 84)]),
    ('cabeca', (92, 62), 13),
    ('alvo', [(104, 84), (46, 80)]),
    ('corpo', [(104, 84), (78, 112), (80, 148)]),
    ('elastico', [(24, 56), (46, 80)]),
    ('seta', (150, 118), (168, 132)),
])

def main():
    raiz = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img')
    for nome, (legenda, pose) in POSES.items():
        chao = not any(el[0] == 'texto' and 'cima' in el[2] for el in pose)
        with open(os.path.join(raiz, f'{nome}.svg'), 'w') as f:
            f.write(svg(pose, legenda, chao=chao))
    print(f'{len(POSES)} ilustrações geradas em img/')

if __name__ == '__main__':
    main()
