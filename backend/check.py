with open('.env', 'rb') as f:
    content = f.read()
    print(f"Full HEX content:\n{content.hex(' ')}")

    try:
        content.decode('utf-8')
        print("\n✅ File is clean UTF-8")
    except UnicodeDecodeError as e:
        print(f"\n❌ Found error at position {e.start}")
        print(f"Bad byte: {content[e.start:e.start+1].hex()}")
