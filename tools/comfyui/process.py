"""Crop, clean up and finish a 1536x864 render as a 1152x864 wiki JPG.

    python3 tools/comfyui/process.py in.png out.jpg --crop X [--blur x0,y0,x1,y1 ...] [--soft ...] [--flag ...] [--hue H] [--desat ...] [--gray] [--strength S] [--seed N]

Coordinates are in the original 1536x864 frame. --blur pixelates a box (small plates and signs); --soft is a feathered
Gaussian blur that reads as depth of field (advertising boards, lettering on buildings); --flag repaints the saturated
pixels in a box crimson (or --hue, OpenCV hue 0-179; 103 is UN blue); --desat tones down red patches (wind-burnt cheeks
that come out like paint); --gray converts to black and white. Finishes with camera_look.py at --strength (default 0.35)."""
import argparse, subprocess, numpy as np, cv2
from PIL import Image, ImageFilter
ap=argparse.ArgumentParser(); ap.add_argument("src"); ap.add_argument("dst")
ap.add_argument("--crop",type=int,default=192); ap.add_argument("--blur",nargs="*",default=[]); ap.add_argument("--flag",nargs="*",default=[])
ap.add_argument("--seed",type=int,default=1); ap.add_argument("--strength",type=float,default=0.35); ap.add_argument("--gray",action="store_true"); ap.add_argument("--hue",type=int,default=178); ap.add_argument("--desat",nargs="*",default=[]); ap.add_argument("--soft",nargs="*",default=[])
a=ap.parse_args()
im=Image.open(a.src).convert("RGB")
for b in a.blur:
    x0,y0,x1,y1=map(int,b.split(","))
    reg=im.crop((x0,y0,x1,y1)); w,h=reg.size
    reg=reg.resize((max(1,w//6),max(1,h//6)),Image.BILINEAR).resize((w,h),Image.BILINEAR).filter(ImageFilter.GaussianBlur(2))
    im.paste(reg,(x0,y0))
for b in a.soft:
    x0,y0,x1,y1=map(int,b.split(","))
    bl=im.filter(ImageFilter.GaussianBlur(3.5))
    m=Image.new("L",im.size,0); 
    from PIL import ImageDraw; ImageDraw.Draw(m).rectangle((x0,y0,x1,y1),fill=255)
    m=m.filter(ImageFilter.GaussianBlur(6))
    im=Image.composite(bl,im,m)
arr=np.asarray(im).copy()
for b in a.flag:
    x0,y0,x1,y1=map(int,b.split(","))
    reg=arr[y0:y1,x0:x1]; hsv=cv2.cvtColor(reg,cv2.COLOR_RGB2HSV)
    m=(hsv[...,1]>70).astype(np.uint8)
    m=cv2.morphologyEx(cv2.dilate(m,np.ones((3,3),np.uint8)),cv2.MORPH_CLOSE,np.ones((5,5),np.uint8)).astype(bool)
    hsv[...,0][m]=a.hue; hsv[...,1][m]=np.maximum(hsv[...,1][m],200)
    hsv[...,2][m]=np.clip(hsv[...,2][m].astype(int)*0.8,0,255).astype(np.uint8)
    arr[y0:y1,x0:x1]=cv2.cvtColor(hsv,cv2.COLOR_HSV2RGB)
for b in a.desat:
    x0,y0,x1,y1=map(int,b.split(","))
    reg=arr[y0:y1,x0:x1]; hsv=cv2.cvtColor(reg,cv2.COLOR_RGB2HSV).astype(np.float32)
    red=((hsv[...,0]<12)|(hsv[...,0]>168))&(hsv[...,1]>60)
    w=cv2.GaussianBlur(red.astype(np.float32),(0,0),4)
    hsv[...,1]*=1-0.6*w
    arr[y0:y1,x0:x1]=cv2.cvtColor(hsv.astype(np.uint8),cv2.COLOR_HSV2RGB)
im=Image.fromarray(arr).crop((a.crop,0,a.crop+1152,864))
if a.gray: im=im.convert("L").convert("RGB")
tmp=a.dst+".tmp.png"; im.save(tmp)
subprocess.run(["python3",__import__("os").path.join(__import__("os").path.dirname(__import__("os").path.abspath(__file__)),"camera_look.py"),tmp,a.dst,"--strength",str(a.strength),"--seed",str(a.seed)],check=True)
import os; os.remove(tmp)
